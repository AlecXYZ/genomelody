diatonic_mapping = {
    "A": 60,  # C
    "AA": 62,  # D
    "C": 64,  # E
    "CC": 65,  # F
    "G": 67,  # G
    "GG": 69,  # A
    "T": 71,  # B/H
}

diatonic_description = "The algorithm parses lines of a file, containing nucleotides, into pairs. Each of the four individual \
                        nucleotides, as well as their pairs consisting of only one type of nucleotide (except TT), is assigned a \
                        note from the diatonic scale, which includes seven notes in total."

def map_diatonic(sequence, is_end):
    """
    Convert sequence of nucleotides into 2D notes array. The algorithm first splits the sequence into pairs and then converts them
    to notes based on the above dictionary. It returns the converted sequence and any leftover characters. In case when end of file flag
    is set to true, it converts leftover characters too.
    
    Arguments:
        sequence (str): One line of file containing nucleotides.
        is_end (bool): End of file flag.
    """
    mapped_sequence = []

    # Not processing leftover
    if is_end is False:
        i = 0
        # Process the sequence in groups of 2 characters
        while i < len(sequence):
            # Get the next 2 characters
            pair = sequence[i:i + 2]

            # If pair is shorter than 2, return it as leftover - only at the end of sequence
            if len(pair) < 2:
                return mapped_sequence, pair

            # Whole pair is in our mapping
            if pair in diatonic_mapping:
                mapped_sequence.append([diatonic_mapping.get(pair)])
            # Only single nucleotides in our mapping
            else:
                mapped_sequence.append([diatonic_mapping.get(pair[:1])])
                mapped_sequence.append([diatonic_mapping.get(pair[1:])])
            i += 2  # Move to the next pair
    # Process leftover at the end of file - could be length of 1
    else:
        # Only single nucleotid in our mapping
        mapped_sequence.append([diatonic_mapping.get(sequence)])

    return mapped_sequence, ""  # No leftover, return empty string

def descript_diatonic():
    """
    Returns description of diatonic mapping algorithm.
    """
    return diatonic_description