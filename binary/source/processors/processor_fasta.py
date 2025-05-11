from mappings import *
from converters import *

def process_fasta(file, midi_path, wav_path, mapping_algorithm, midi_algorithm, synthesize_algorithm, start_line, stop_line, bpm, instrument):
    """
    Read the FASTA file and use selected algorithms/synthesize method on the nucleotide sequence. The FASTA processor serves as an adapter
    which connects and applies algorithms from different modules. This method creates modular enviroment with option to simply add new conversion
    algorithms to backend. At first, the file is splitted into lines skipping the header line of FASTA file. Then conversion algorithm is applied
    at each line. Finally sequence of notes is written to MIDI file and optionally MIDI file is converted to WAV file.

    Arguments:
        file (file): Whole file with nucleotide sequence.
        midi_path (str): Path to save the created MIDI file.
        wav_path (str): Path to save the created WAV file.
        mapping_algorithm (function): Selected mapping algorithm to create notes from nucleotides.
        midi_algorithm (function): Algorithm to create MIDI file from notes.
        synthesize_algorithm (function): Algorithm to synthesize audio file from MIDI file.
        start_line (int): First line (Header not counted) that would be converted to notes.
        stop_line (int): Last line (Header not counted) that would be converted to notes.
        bpm (int): Beats per minute to set the tempo.
        instrument (int): Represents picked instrument according to MIDI standard.
    """
    buffer = ""  # Buffer to hold the last nucleotides of the previous line (leftover characters)
    full_sequence = []
    line_count = 1

    # Read lines of file with nucleotide sequence
    for line in file.splitlines():
        # Clear line from "\n"
        line = line.strip()

        # Skip header line
        if line.startswith(">"):
            continue

        # Stop reading when desired number of lines were processed
        if stop_line is not None and line_count > stop_line:
            break

        # Iterate to start line of conversion
        if line_count < start_line:
            line_count += 1
            continue

        # End of file with "\n"
        elif line == "":
            break

        # Add any leftover nucleotides to the current line
        line = buffer + line
            
        # Map the current line and handle any leftover characters
        mapped_sequence, buffer = mapping_algorithm(line, False)

        # Add mapped sequence to the full list
        full_sequence.extend(mapped_sequence)
        # Increment line number
        line_count += 1


    # Handle any remaining characters in the buffer at the end (leftover characters)
    if buffer != "":
        # Process the leftover characters
        mapped_sequence, buffer = mapping_algorithm(buffer, True)

        # Add leftover sequence to the full list
        full_sequence.extend(mapped_sequence)

    # Create MIDI file from sequence of notes
    midi_algorithm(full_sequence, midi_path, bpm, instrument)

    # Synthesize audio file from MIDI file if it is wanted
    if wav_path is not None:
        synthesize_algorithm(midi_path, wav_path)