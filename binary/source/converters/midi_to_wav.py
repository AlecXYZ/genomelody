import os
import subprocess
import sys

def convert_to_wav(midi_path, wav_path):
    """
    Convert MIDI file to WAV using included fluidsynth.exe and soundfont.

    Arguments:
        midi_path (str): Path to MIDI file.
        wav_path (str): Path to save the created WAV file.
    """
    # Running EXE file
    # Check for PyInstaller folder
    if hasattr(sys, "_MEIPASS"):
        # Path to fluidsynth.exe and soundfont (Bank of sounds) from exe
        fluidsynth_path = os.path.join(sys._MEIPASS, "fluidsynth/bin/fluidsynth.exe")
        soundfont_path = os.path.join(sys._MEIPASS, "soundfont/soundfont.sf2")
    # Running from source
    else:
        # Relative paths to resources
        fluidsynth_path = "fluidsynth/bin/fluidsynth.exe"
        soundfont_path = "soundfont/soundfont.sf2"

    # No external window pop-up
    no_window = 0x08000000

    # Run external synthesizer to convert MIDI to WAV
    # Store/Pipe output prints to result
    # Arguments - "-ni" - do not use MIDI realtime input and non-interactive mode, "F" - render to WAV file, paths - soundfont and midi
    result = subprocess.run([
        fluidsynth_path,
        "-ni",
        "-F", wav_path,
        soundfont_path,
        midi_path
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, creationflags=no_window)

    # If error on exit of subprocess - raise error
    if result.returncode != 0:
        print(f"Error running fluidsynth: {result.stderr.decode().strip()}")