from midi2audio import FluidSynth

def convert_to_wav(midi_path, wav_path):
    """
    Create a WAV file from MIDI file.
    
    Arguments:
        midi_path (str): Path to the existing MIDI file.
        wav_path (str): Path to save the created WAV file.
    """
    # Initialize FluidSynth (External synthesizer to create WAV) with the soundfont (Bank of instrument sounds)
    fs = FluidSynth('soundfont/soundfont.sf2')

    # Convert MIDI to WAV
    fs.midi_to_audio(midi_path, wav_path)