from mappings import *
from converters import *

def process_double_fasta(seq_first_full, seq_second_full, start_nuc, stop_nuc, midi_path, wav_path, mapping_algorithm, midi_algorithm, synthesize_algorithm, bpm, instrument):
    """
    Read the FASTA sequences, combine them and use selected algorithms/synthesize method on the nucleotide sequence. The doulbe FASTA processor serves 
    as an adapter which connects and applies algorithms from different modules. This method creates modular enviroment with option to simply add new conversion
    algorithms to backend. At first, the sequnces are cut according to the start and stop index. Then conversion algorithm is applied at each sequnce. Finally 
    sequences of notes are merged and written to MIDI file/optionally MIDI file is converted to WAV file.

    Arguments:
        seq_first_full (file): Sequence of nucleotides from first file.
        seq_second_full (file): Sequence of nucleotides from second file.
        start_nuc (int): First nucleotide that would be converted to notes.
        stop_nuc (int): Last nucleotide that would be converted to notes.
        midi_path (str): Path to save the created MIDI file.
        wav_path (str): Path to save the created WAV file.
        mapping_algorithm (function): Selected mapping algorithm to create notes from nucleotides.
        midi_algorithm (function): Algorithm to create MIDI file from notes.
        synthesize_algorithm (function): Algorithm to synthesize audio file from MIDI file.
        bpm (int): Beats per minute to set the tempo.
        instrument (int): Represents picked instrument according to MIDI standard.
    """
    # Extract indexes from the start and stop nucleotide
    if start_nuc is not None and stop_nuc is not None:
        # Edit the index - correct indexing from 0
        start_index = max(start_nuc - 1, 0)
        stop_index = stop_nuc

    # Cut desired part of each sequence
    seq_first = seq_first_full[start_index:stop_index]
    seq_second = seq_second_full[start_index:stop_index]

    # Map first sequence into notes using selected algorithm
    seq_first_part, buffer_first = mapping_algorithm(seq_first, False)
    if buffer_first != "":
        seq_first_end, _ = mapping_algorithm(buffer_first, True)
        full_first = seq_first_part + seq_first_end
    else:
        full_first = seq_first_part

    # Map second sequence into notes using selected algorithm
    seq_second_part, buffer_second = mapping_algorithm(seq_second, False)
    if buffer_second != "":
        seq_second_end, _ = mapping_algorithm(buffer_second, True)
        full_second = seq_second_part + seq_second_end
    else:
        full_second = seq_second_part

    combined_sequence = []
    # Find max length
    max_len = max(len(full_first), len(full_second))

    # Combine both sequences
    for i in range(max_len):
        # If sequence is in range, lower the first note by octave to create chord
        if (i < len(full_first)):
            # Lower by octave
            note_first = full_first[i][0] - 12
        # Sequence out of range - no note (other sequence is longer)
        else:
            note_first = None

        # If we are in range, get the note to create chord
        if (i < len(full_second)):
            note_second = full_second[i][0]
        # Sequence out of range - no note (other sequence is longer)
        else:
            note_second = None

        # Both notes are available - create chord
        if note_first is not None and note_second is not None:
            combined_sequence.append([note_first, note_second])
        # Only note from one of sequences is available (one sequence of notes is longer) - append only one available note
        elif note_first is not None:
            combined_sequence.append([note_first])
        elif note_second is not None:
            combined_sequence.append([note_second])

    # Create MIDI file from sequence of notes
    midi_algorithm(combined_sequence, midi_path, bpm, instrument)

    # Synthesize audio file from MIDI file if it is wanted
    if wav_path is not None:
        synthesize_algorithm(midi_path, wav_path)