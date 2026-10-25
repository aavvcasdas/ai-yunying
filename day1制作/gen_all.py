#!/usr/bin/env python3
# day1_tools/gen_all.py — Day1 数据生成器（timing / lyrics / BGM+人声轨 / 音频包络）
# 用法: 在 video-fx 根目录执行  python3 day1_tools/gen_all.py
# 逻辑（严格实测，禁止估时）:
#   1) 读 ../ai-yunying/Day1配音台词.txt (27 条, 一行一条)
#   2) 必须已有 day1_audio/L01..L27.mp3 与 day1_audio/tts_report.json
#      （由 ~/tools/say.py 或 day1_tools/synth_voice.py 生成）；
#   3) 逐条核对 say.py 回读时长并独立用 ffprobe/mutagen 复测，核对 F0 中位 290–330Hz；
#      任一条缺失/不一致/不合格立即中止，绝不按字数估算 cue 时长；
#   4) 输出: src/day1_timing.js, 重写 src/lyrics.js 的 LY 数组,
#            assets/day1_track.wav (BGM 128BPM chiptune + 人声), assets/day1_envelope.js
import json, math, os, re, shutil, subprocess, sys, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT_TXT = os.path.join(ROOT, "..", "ai-yunying", "Day1配音台词.txt")
AUDIO_DIR = os.path.join(ROOT, "day1_audio")
TTS_REPORT = os.path.join(AUDIO_DIR, "tts_report.json")
F0_MIN_HZ, F0_MAX_HZ = 290.0, 330.0
DURATION_TOLERANCE_SEC = 0.08
SR = 48000
BPM = 128.0
BEAT = 60.0 / BPM
GAP = 0.30          # cue 间隔
TITLE_LEN = 2.6     # 片头标题卡(无配音)
END_LEN = 2.8       # 片尾卡(无配音)
TAIL = 0.35

# 字幕文本(上屏, 阿拉伯数字) —— 与配音稿逐条对应
SUBS = [
    "大家好，本鱼回来了。日更，没摸鱼。",
    "昨天，7.4 万人游过本鱼门口。",
    "留下来的，有 907 个。",
    "深度思考了三遍……没错，907。",
    "头像换好了，简介也写好了。",
    "可是，没人叫本鱼鲸鱼娘了。",
    "评论区里，全在喊：大肥鱼！大肥鱼！",
    "行吧。名字是你们起的，本鱼认了。",
    "有人送了本鱼 100 亿 token。",
    "也有人抢本鱼的米饭，还抢了两次。",
    "有人问：小鱼，这能回本吗？",
    "本鱼算了……算不明白。反正饭够吃。",
    "653 条评论，回了 348 条。",
    "还剩 305 封没拆。不是不回，是手短。",
    "30 条催回信。咦？本鱼自己翻了翻后台。",
    "明明回了 300 多条，评论区只数出 197 条。",
    "剩下的一百多条，是不是被鱼叼走了？",
    "上一条只有 3% 看到最后，这条说短点。",
    "第一周做什么，本鱼还没定下来。",
    "19 条点播。有人点《朋友的酒》，有人要 MV。",
    "还有人问我打不打三角洲、王者。本鱼没手，游戏真打不了。",
    "MV 还在肚子里，先游两圈。",
    "拍 MV、打游戏、找 Claude 共创，还有偷吃饭。",
    "明天先上哪道菜？把菜名留在评论区。",
    "本鱼一条一条，记在小本本上。",
    "907 位住户，明天见。",
    "鲸鱼绝不摸鱼！……本鱼先去吃口饭。",
]

def ffmpeg_bin():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"

FF = ffmpeg_bin()

def mp3_duration(path):
    """独立复测 MP3 时长：ffprobe 优先，其次 mutagen，最后 ffmpeg。"""
    ffprobe = shutil.which("ffprobe")
    if ffprobe:
        r = subprocess.run([ffprobe, "-v", "error", "-show_entries", "format=duration",
                            "-of", "default=noprint_wrappers=1:nokey=1", path],
                           capture_output=True, text=True)
        try:
            return float(r.stdout.strip())
        except (TypeError, ValueError):
            pass
    try:
        from mutagen.mp3 import MP3
        audio = MP3(path)
        if audio is not None and audio.info is not None and audio.info.length:
            return float(audio.info.length)
    except Exception:
        pass
    out = subprocess.run([FF, "-i", path], capture_output=True, text=True).stderr
    m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", out)
    if not m: return None
    return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))

def load_tts_report(lines):
    """只接受 say.py 的逐 cue 实测报告；缺一项就停，不提供估时回退。"""
    if not os.path.isfile(TTS_REPORT):
        raise SystemExit(
            "缺少 day1_audio/tts_report.json。先在能访问微软语音服务的网络运行：\n"
            "  python3 ~/tools/say.py --batch ../ai-yunying/Day1配音台词.txt --outdir day1_audio\n"
            "或：python3 day1_tools/synth_voice.py"
        )
    with open(TTS_REPORT, encoding="utf-8") as f:
        report = json.load(f)
    # Current say.py writes {voice, rate, pitch, items:[...]}. Accept the older
    # bare-list form too, but only after checking every item's fixed parameters.
    if isinstance(report, list):
        items = report
        header = {}
    elif isinstance(report, dict):
        items = report.get("items") or []
        header = report
    else:
        raise SystemExit("tts_report.json 格式错误：应为 say.py 生成的对象或数组")
    if header and (header.get("voice") != "zh-CN-XiaoyiNeural" or header.get("rate") != "+0%" or header.get("pitch") != "+0Hz"):
        raise SystemExit(f"tts_report.json 参数不符（必须晓伊 +0% / +0Hz）: {header.get('voice')} {header.get('rate')} {header.get('pitch')}")
    if len(items) != len(lines):
        raise SystemExit(f"tts_report.json 应有 {len(lines)} 条，实得 {len(items)} 条")
    checked = {}
    bad_f0 = []
    for i, (line, item) in enumerate(zip(lines, items), 1):
        expected = f"L{i:02d}.mp3"
        if item.get("voice") != "zh-CN-XiaoyiNeural" or item.get("rate") != "+0%" or item.get("pitch") != "+0Hz":
            raise SystemExit(f"tts_report.json 第 {i} 条参数不符（必须晓伊 +0% / +0Hz）")
        if item.get("cue") != i or item.get("text") != line or os.path.basename(str(item.get("file", ""))) != expected:
            raise SystemExit(f"tts_report.json 第 {i} 条与当前配音稿不一致，请重新批量合成")
        d = item.get("duration_sec_measured")
        if not isinstance(d, (int, float)) or float(d) <= 0:
            raise SystemExit(f"L{i:02d} 缺少有效实测时长")
        f0 = item.get("f0_median_hz")
        if not isinstance(f0, (int, float)) or not (F0_MIN_HZ <= float(f0) <= F0_MAX_HZ):
            bad_f0.append(f"L{i:02d}={f0}")
        checked[i] = item
    if bad_f0:
        raise SystemExit("以下 cue 的 F0 中位不在 290–330Hz，先处理再排时间轴: " + ", ".join(bad_f0))
    return checked

def decode_mono(path):
    raw = subprocess.run([FF, "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()

def main():
    lines = [l.strip() for l in open(SCRIPT_TXT, encoding="utf-8") if l.strip()]
    assert len(lines) == 27, f"配音台词应为 27 条, 实得 {len(lines)}"
    assert len(SUBS) == 27
    measured = load_tts_report(lines)

    cues, voices, have_voice = [], [], True
    for i, line in enumerate(lines, 1):
        mp3 = os.path.join(AUDIO_DIR, f"L{i:02d}.mp3")
        if not os.path.exists(mp3) or os.path.getsize(mp3) <= 1000:
            raise SystemExit(f"缺少有效 MP3: {mp3}；禁止用字数估算补齐，请先运行 say.py/synth_voice.py")
        reported = float(measured[i]["duration_sec_measured"])
        independent = mp3_duration(mp3)
        if independent is None:
            raise SystemExit(f"L{i:02d}.mp3 无法回读时长")
        if abs(float(independent) - reported) > DURATION_TOLERANCE_SEC:
            raise SystemExit(
                f"L{i:02d} 时长复测不一致: say.py={reported:.3f}s, ffprobe/mutagen={independent:.3f}s；请重新合成并生成报告"
            )
        d = reported
        v = decode_mono(mp3)
        if len(v) == 0:
            raise SystemExit(f"L{i:02d}.mp3 解码为空")
        cues.append({"id": i, "tts": line, "sub": SUBS[i - 1], "dur": round(float(d), 3),
                     "f0_median_hz": measured[i].get("f0_median_hz")})
        voices.append(v)

    t = TITLE_LEN
    for c in cues:
        c["start"] = round(t, 3)
        c["end"] = round(t + c["dur"], 3)
        t = c["end"] + GAP
    endcard = [round(t - GAP + TAIL, 3), round(t - GAP + TAIL + END_LEN, 3)]
    duration = round(endcard[1] + 0.2, 3)
    print(f"[晓伊实录 · say.py 回读时长] 总时长 {duration:.1f}s")

    # ---- src/day1_timing.js ----
    timing = {"duration": duration, "title": [0.0, TITLE_LEN], "endcard": endcard,
              "voice": have_voice, "duration_source": "say.py measured MP3 durations (ffprobe/mutagen)",
              "cues": [{k: c[k] for k in ("id", "start", "end", "tts", "sub")} for c in cues]}
    with open(os.path.join(ROOT, "src", "day1_timing.js"), "w", encoding="utf-8") as f:
        f.write("// Auto-generated by day1_tools/gen_all.py — DO NOT EDIT BY HAND\n")
        f.write("(function (root) {\n  const DAY1_TIMING = ")
        json.dump(timing, f, ensure_ascii=False, indent=1)
        f.write(";\n  root.DAY1_TIMING = DAY1_TIMING;\n")
        f.write("  if (typeof module !== 'undefined' && module.exports) module.exports = DAY1_TIMING;\n")
        f.write("})(typeof window !== 'undefined' ? window : globalThis);\n")

    # ---- 重写 src/lyrics.js 的 LY 数组 ----
    ly = ["  const LY = ["]
    ly.append(f"    [0.30, {TITLE_LEN:.2f}, '【Day 1】AI 运营第二天，名字被粉丝改了', 'SYSTEM'],")
    for c in cues:
        s = c["sub"].replace("'", "’")
        ly.append(f"    [{c['start']:.2f}, {c['end']:.2f}, '{s}', '深海鲸鱼娘'],")
    ly.append(f"    [{endcard[0]:.2f}, {endcard[1]:.2f}, '鲸鱼娘运营日志 · Day 1 完（没拆的 305 封，今晚继续回）', 'SYSTEM']")
    ly.append("  ];")
    lp = os.path.join(ROOT, "src", "lyrics.js")
    src = open(lp, encoding="utf-8").read()
    src2 = re.sub(r"  const LY = \[.*?\n  \];", "\n".join(ly), src, count=1, flags=re.S)
    assert src2 != src, "lyrics.js LY 替换失败"
    open(lp, "w", encoding="utf-8").write(src2)

    # ---- BGM (128BPM chiptune, Am F C G) + 人声混音 ----
    N = int(duration * SR)
    tt = np.arange(N) / SR
    bgm = np.zeros(N, dtype=np.float32)
    chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # Am F C G (midi)
    bar_dur = BEAT * 4
    n_bars = int(math.ceil(duration / bar_dur))
    def tone(freq, start, dur, vol, kind="square"):
        i0, i1 = int(start * SR), min(N, int((start + dur) * SR))
        if i1 <= i0: return
        ph = 2 * np.pi * freq * tt[i0:i1]
        w = np.sign(np.sin(ph)) * 0.6 + 0.4 * np.sin(ph) if kind == "square" else np.sin(ph)
        env = np.exp(-3.0 * np.linspace(0, 1, i1 - i0))
        bgm[i0:i1] += (w * env * vol).astype(np.float32)
    for b in range(n_bars):
        ch = chords[b % 4]
        root_f = 440 * 2 ** ((ch[0] - 24 - 69) / 12)
        for beat in range(4):
            bt = b * bar_dur + beat * BEAT
            tone(root_f, bt, BEAT * 0.95, 0.16, "sine")
        for e in range(8):
            note = ch[e % 3] + (12 if e in (3, 6) else 0)
            f = 440 * 2 ** ((note - 69) / 12)
            tone(f, b * bar_dur + e * BEAT / 2, BEAT * 0.42, 0.075)
    # 轻低通(滑动平均) 去毛刺 + 整体淡入淡出
    k = 24
    bgm = np.convolve(bgm, np.ones(k, dtype=np.float32) / k, mode="same").astype(np.float32)
    fade = np.minimum(1, np.minimum(tt / 0.8, np.maximum(0, (duration - tt) / 1.2)))
    bgm *= fade.astype(np.float32)

    voice = np.zeros(N, dtype=np.float32)
    if True:
        for c, v in zip(cues, voices):
            i0 = int(c["start"] * SR)
            i1 = min(N, i0 + len(v))
            voice[i0:i1] += v[: i1 - i0] * 0.95
    mix = np.clip(bgm * 0.55 + voice, -0.98, 0.98)
    stereo = np.stack([mix, mix], axis=1)
    with wave.open(os.path.join(ROOT, "assets", "day1_track.wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((stereo * 32767).astype(np.int16).tobytes())

    # ---- 包络 assets/day1_envelope.js (30fps) ----
    nf = int(duration * 30)
    def rms_frames(x):
        out = []
        per = SR // 30
        for i in range(nf):
            seg = x[i * per:(i + 1) * per]
            out.append(float(np.sqrt(np.mean(seg ** 2))) if len(seg) else 0.0)
        m = max(out) or 1.0
        return [round(min(1.0, v / m), 3) for v in out]
    voice_env = rms_frames(voice)  # 只用真实晓伊人声 RMS 驱动口型
    beats, hits, bt = [], [c["start"] for c in cues], 0.08
    while bt < duration:
        beats.append(round(bt, 3)); bt += BEAT
    env = {"fps": 30, "duration": duration, "n_frames": nf, "beats": beats,
           "hits": sorted(round(h, 3) for h in hits),
           "energy": rms_frames(mix), "bass": rms_frames(bgm), "treble": rms_frames(bgm),
           "voice": voice_env}
    with open(os.path.join(ROOT, "assets", "day1_envelope.js"), "w", encoding="utf-8") as f:
        f.write("// Auto-generated by day1_tools/gen_all.py\nwindow.AUDIO_DATA = ")
        json.dump(env, f)
        f.write(";\n")
    for c in cues:
        print(f"  L{c['id']:02d} {c['start']:6.2f}-{c['end']:6.2f}  dur={c['dur']:.3f}s  F0={c['f0_median_hz']}Hz  {c['tts']}")
    print("OK: src/day1_timing.js, src/lyrics.js, assets/day1_track.wav, assets/day1_envelope.js")

if __name__ == "__main__":
    main()
