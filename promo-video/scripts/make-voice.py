# Voiceover "nenek" untuk video story KasirOK (9:16, 30 dtk).
# edge-tts (id-ID-GadisNeural) dibuat lebih tua: tempo pelan + pitch turun saat
# sintesis, lalu ffmpeg menambah getar halus (vibrato/tremolo) dan warna hangat.
# Hasil: public/audio/vo/<id>.wav + src/story/voice.json (durasi tiap kalimat).
# Jalankan dari folder promo-video:  python scripts/make-voice.py
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'public', 'audio', 'vo')
JSON_OUT = os.path.join(ROOT, 'src', 'story', 'voice.json')
VOICE = 'id-ID-GadisNeural'

LINES = [
    ('hook', 'Nak, warungmu masih nyatat utang di buku?'),
    ('past', 'Bukunya hilang, utangnya ikut hilang.'),
    ('debt', 'Pakai KasirOK. Utang tercatat, bisa dicicil.'),
    ('stock', 'Barang mau habis? Dikasih tahu.'),
    ('offline', 'Internet mati? Tetap bisa jualan.'),
    ('report', 'Laporannya jelas, naik dua belas persen.'),
    ('cta', 'KasirOK. Nenek saja bisa.'),
]

# Older voice: slower and lower. Pitch is shifted inside the TTS engine, which keeps
# the voice clear (an ffmpeg resample would make it muddy / "slowed tape").
RATE = '-12%'
PITCH = '-14Hz'

# Gentle age texture, kept subtle so words stay crisp:
#  vibrato  = slight voice tremor     tremolo = small breath/volume wobble
#  eq       = less "radio presenter" brightness, a bit of chest warmth
#  acompressor + loudnorm = even level, clear on phone speakers
FILTERS = ','.join([
    'highpass=f=80',
    'vibrato=f=5.2:d=0.045',
    'tremolo=f=4.6:d=0.07',
    'equalizer=f=220:t=q:w=1.0:g=2.5',
    'equalizer=f=3200:t=q:w=1.2:g=-2',
    'lowpass=f=9000',
    'acompressor=threshold=-20dB:ratio=3:attack=8:release=120',
    'loudnorm=I=-16:TP=-1.5:LRA=7',
    'aresample=44100',
])


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def duration(path):
    out = subprocess.run(
        ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
        check=True, capture_output=True, text=True,
    ).stdout.strip()
    return float(out)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(JSON_OUT), exist_ok=True)
    result = []
    for key, text in LINES:
        raw = os.path.join(OUT_DIR, f'{key}.raw.mp3')
        wav = os.path.join(OUT_DIR, f'{key}.wav')
        run(['edge-tts', '--voice', VOICE, f'--rate={RATE}', f'--pitch={PITCH}',
             '--text', text, '--write-media', raw])
        # Trim TTS silence at both ends so scene timing follows the words, and cap the
        # ~1.2 s pauses edge-tts leaves after "?" / "." to a natural 0.35 s breath.
        trim = 'silenceremove=start_periods=1:start_threshold=-45dB,' \
               'silenceremove=stop_periods=-1:stop_duration=0.35:stop_threshold=-42dB:stop_silence=0.35,' \
               'areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse'
        run(['ffmpeg', '-y', '-i', raw, '-af', f'{trim},{FILTERS}', '-ac', '2', wav])
        os.remove(raw)
        d = round(duration(wav), 3)
        result.append({'id': key, 'text': text, 'file': f'audio/vo/{key}.wav', 'duration': d})
        print(f'{key:8s} {d:5.2f}s  {text}')
    with open(JSON_OUT, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    total = sum(r['duration'] for r in result)
    print(f'total speech {total:.2f}s -> {JSON_OUT}')


if __name__ == '__main__':
    sys.exit(main())
