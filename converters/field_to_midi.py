import mido

def create_standard_midi(full_sequence, midi_path, bpm):
    """
    Create a MIDI file from 2D notes array with specified tempo.
    
    Arguments:
        full_sequence (2D list): A list of note sequences (notes or chords).
        midi_path (str): Path to save the created MIDI file.
        bpm (int): Beats per minute to set the tempo.
    """
    # Create a new MIDI file and track (sound part)
    midi = mido.MidiFile()
    track = mido.MidiTrack()
    midi.tracks.append(track)

    # Set the tempo
    tempo = mido.bpm2tempo(bpm)
    track.append(mido.MetaMessage('set_tempo', tempo=tempo))

    # Set the program to piano (program number 0 - according to MIDI standard)
    track.append(mido.Message('program_change', program=0))

    # Write the note sequence to the MIDI track
    for notes in full_sequence:
        # Note-on messages for all notes in the sequence (chord or single note)
        for note in notes:
            # Arguments: note - number representing tone, velocity - number representing strength, time - number representing start time
            track.append(mido.Message('note_on', note=note, velocity=100, time=0))
        # Note-off messages for all notes
        for note in notes:
            # Arguments: note - number representing tone, velocity - number representing strength, time - number representing stop time
            # Duration of 480 ticks represents quarter note in MIDI standard
            track.append(mido.Message('note_off', note=note, velocity=100, time=480))

    # Save the MIDI file to the specified path
    midi.save(midi_path)