import eel
import os
from io import BytesIO
import shutil
from mido import MidiFile
from processors import *
from mappings import *
from converters import *

# Constant path where temporary folder will be created
TEMP_FOLDER = "web/temp"

"""############################################ EEL functions for GUI ############################################"""

def init_app():
    """
    Create temporary folder at the application start-up.
    """
    # Create temporary folder
    if not os.path.exists(TEMP_FOLDER):
        os.makedirs(TEMP_FOLDER)
        print(f"Temporary folder '{TEMP_FOLDER}' created.")

@eel.expose
def quit_app():
    """
    Terminate the EEL application and delete temporary folder.
    """
    try:
        if os.path.exists(TEMP_FOLDER):
            # Delete folder and its content
            shutil.rmtree(TEMP_FOLDER)
            print(f"Temporary folder '{TEMP_FOLDER}' deleted.")

    except Exception as e:
        print(f"Error while deleting temporary folder: {e}")

    print("Application closed.")
    os._exit(0)  # Exit the process

"""---------------------------------------------Synthesizer functions---------------------------------------------"""

@eel.expose
def process_fasta_to_music(fasta_content, start_line, stop_line, algorithm, instrument, bpm, convert_to_wav_flag):
    """
    Convert FASTA file to MIDI and optionally WAV using selected parameters.

    Arguments:
        fasta_content (file): Whole file with nucleotide sequence.
        start_line (int): First line (Header not counted) that would be converted to notes.
        stop_line (int): Last line (Header not counted) that would be converted to notes.
        algorithm (function): Selected mapping algorithm to create notes from nucleotides.
        instrument (int): Represents picked instrument according to MIDI standard.
        bpm (int): Beats per minute to set the tempo.
        convert_to_wav_flag (bool): Flag that represents if wav file should be created.
    """
    # Base name
    base_name = "synth_output"
    
    # Set paths using the base name
    midi_path = os.path.join(TEMP_FOLDER, f"{base_name}.mid")
    wav_path = os.path.join(TEMP_FOLDER, f"{base_name}.wav")

    # Select mapping algorithm
    if algorithm == "map_chromatic":
        mapping_algorithm = map_chromatic
    elif algorithm == "map_diatonic":
        mapping_algorithm = map_diatonic
    elif algorithm == "map_binary":
        mapping_algorithm = map_binary

    # Start processor/adapter with selected values from frontend
    process_fasta(
        fasta_content,
        midi_path,
        wav_path if convert_to_wav_flag else None,
        mapping_algorithm,
        create_standard_midi,
        convert_to_wav,
        start_line,
        stop_line,
        bpm,
        instrument
    )

    print(f"File processed: {base_name}\n")

    # Return dictionary with path to MIDI file, optionally WAV file and base name
    return {
        "midi": f"/temp/{base_name}.mid",
        "wav": f"/temp/{base_name}.wav" if convert_to_wav_flag else None,
        "name": base_name}

@eel.expose
def get_description(algorithm):
    """
    Get description of selected algorithm.

    Arguments:
        algorithm (string): Selected mapping algorithm to create notes from nucleotides.
    """
    # Select description method based on the mapping algorithm
    if algorithm == "map_chromatic":
        descript_algorithm = descript_chromatic
    elif algorithm == "map_diatonic":
        descript_algorithm = descript_diatonic
    elif algorithm == "map_binary":
        descript_algorithm = descript_binary

    # Get string with description
    return descript_algorithm()

@eel.expose
def get_algorithm_mapping(algorithm_name):
    """
    Return mapping of selected algorithm with note names instead of MIDI numbers (Only values that are integers will be converted).

    Arguments:
        algorithm_name (string): Selected mapping algorithm to create notes from nucleotides.
    """
    # Choose dictionary based on algorithm
    if algorithm_name == "map_chromatic":
        mapping = get_mapping_chromatic()
    elif algorithm_name == "map_diatonic":
        mapping = get_mapping_diatonic()
    elif algorithm_name == "map_binary":
        mapping = get_mapping_binary()

    # Convert to dictionary with note names
    readable_mapping = {}
    for key, value in mapping.items():
        # Value is integer - convert it to note
        if isinstance(value, int):
            readable_mapping[key] = midi_num_to_note(value)
        # Value is not integer
        else:
            readable_mapping[key] = value

    # Get transformed mapping
    return readable_mapping

"""---------------------------------------------Comparator functions----------------------------------------------"""

@eel.expose
def process_double_fasta_to_music(seq_first, seq_second, start_nuc, stop_nuc, algorithm, instrument, bpm, convert_to_wav_flag):
    """
    Combine two FASTA files, convert the result sequence to MIDI and optionally WAV using selected parameters.

    Arguments:
        seq_first (file): Sequence of nucleotides from first file.
        seq_second (file): Sequence of nucleotides from second file.
        start_nuc (int): First nucleotide that would be converted to notes.
        stop_nuc (int): Last nucleotide that would be converted to notes.
        algorithm (function): Selected mapping algorithm to create notes from nucleotides.
        instrument (int): Represents picked instrument according to MIDI standard.
        bpm (int): Beats per minute to set the tempo.
        convert_to_wav_flag (bool): Flag that represents if wav file should be created.
    """
    # Base name
    base_name = "comp_output"
    midi_path = os.path.join(TEMP_FOLDER, f"{base_name}.mid")
    wav_path = os.path.join(TEMP_FOLDER, f"{base_name}.wav")
    
    # Select mapping algorithm
    if algorithm == "map_chromatic":
        mapping_algorithm = map_chromatic
    elif algorithm == "map_diatonic":
        mapping_algorithm = map_diatonic
    elif algorithm == "map_binary":
        mapping_algorithm = map_binary

    # Start processor/adapter with selected values from frontend
    process_double_fasta(
        seq_first,
        seq_second,
        start_nuc,
        stop_nuc,
        midi_path,
        wav_path if convert_to_wav_flag else None,
        mapping_algorithm,
        create_standard_midi,
        convert_to_wav,
        bpm,
        instrument
    )

    print(f"File processed: {base_name}\n")

    # Return dictionary with path to MIDI file, optionally WAV file and base name
    return {
        "midi": f"/temp/{base_name}.mid",
        "wav": f"/temp/{base_name}.wav" if convert_to_wav_flag else None,
        "name": base_name
    }

"""--------------------------------------------Piano player functions---------------------------------------------"""

@eel.expose
def upload_midi(file_content):
    """
    Extract notes with its timings and durations from MIDI file. The result is required for player to make visualization.

    Arguments:
        file_content (file): Content of MIDI file.
    """
    try:
        # Read MIDI directly from memory using byte stream
        midi_data = BytesIO(bytearray(file_content))
        # Call function to parse MIDI file
        midi_notes = parse_midi(midi_data)

        # Return array of notes with its timings and durations
        return midi_notes
    
    except Exception as e:
        print(f"Error while processing MIDI file: {e}")
        return []

"""--------------------------------------------Help functions for GUI---------------------------------------------"""

def parse_midi(midi_data):
    """
    Extract a list of notes with timings and durations from MIDI file.

    Arguments:
        midi_data (stream): Content of MIDI file in form of byte stream.
    """
    # Load MIDI file
    midi = MidiFile(file=midi_data)
    # List with notes and timings
    notes = []
    # Actual playback time
    current_time = 0
    # Dictionary of notes with their start times
    note_on_times = {}

    # Iterate over each note in MIDI file (note on and off message)
    for message in midi:
        # Extract timing of note and add it to global time
        current_time += message.time
        # Note on - record the start time - skip notes that have volume 0
        if message.type == "note_on" and message.velocity > 0:
            # Write note and its start time to the dictionary
            note_on_times[message.note] = current_time

        # Note off - calculate duration
        elif message.type == "note_off":
            # Check if note started
            if message.note in note_on_times:
                # Get start time and pop the note out of the dictionary
                start_time = note_on_times.pop(message.note)
                # Calculate duration from start time and actual playback time
                duration = current_time - start_time
                # Append note as dictionary with time, note and duration to the list of notes
                notes.append({
                    "time": start_time,
                    "note": midi_num_to_note(message.note),
                    "duration": duration})
    
    print("Notes with timings:")
    print(notes)
    print()

    # Return the notes with timings to frontend - display it
    return notes

def midi_num_to_note(note_number):
    """
    Get note with octave from MIDI note number.

    Arguments:
        note_number (int): MIDI note number.
    """
    # List of note names
    note_names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

    # Calculate octave
    octave = (note_number // 12) - 1
    # Get note letter from list
    note_name = note_names[note_number % 12]

    # Return string with note name and octave
    return f"{note_name}{octave}"