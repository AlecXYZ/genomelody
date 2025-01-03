chromatic_mapping = {
    "A": 60, # C
    "AA": 61, # Cis
    "AAA": 62, # D
    "C": 63, # Dis
    "CC": 64, # E
    "CCC": 65, # F
    "G": 66, # Fis
    "GG": 67, # G
    "GGG": 68, # Gis
    "T": 69, # A
    "TT": 70, # Ais
    "TTT": 71, # H
}

chromatic_description = "The algorithm parses lines of a file, containing nucleotides, into triplets. Each of the four individual \
                        nucleotides, as well as their pairs and triplets consisting of only one type of nucleotide, is assigned a \
                        note from the chromatic scale, which includes twelve notes in total."

def map_chromatic(sequence, is_end):
    """
    Convert sequence of nucleotides into 2D notes array. The algorithm first splits the sequence into triplets and then converts them
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
        # Process the sequence in groups of 3 characters
        while i < len(sequence):
            # Get the next 3 characters
            triplet = sequence[i:i+3]
        
            # If triplet is shorter than 3, return it as leftover - only at the end of sequence
            if len(triplet) < 3:
                return mapped_sequence, triplet

            # Whole triplet is in our mapping
            if triplet in chromatic_mapping:
                mapped_sequence.append([chromatic_mapping.get(triplet)])
            # First pair is in our mapping
            elif triplet[:2] in chromatic_mapping:
                mapped_sequence.append([chromatic_mapping.get(triplet[:2])])
                mapped_sequence.append([chromatic_mapping.get(triplet[2:])])
            # Second pair is in our mapping
            elif triplet[1:] in chromatic_mapping:
                mapped_sequence.append([chromatic_mapping.get(triplet[:1])])
                mapped_sequence.append([chromatic_mapping.get(triplet[1:])])
            # Only single nucleotides in our mapping
            else:
                mapped_sequence.append([chromatic_mapping.get(triplet[:1])])
                mapped_sequence.append([chromatic_mapping.get(triplet[1:2])])
                mapped_sequence.append([chromatic_mapping.get(triplet[2:])])
            i += 3  # Move to the next triplet
    # Process leftover at the end of file - could be length of 2 or 1
    else:
        # Pair is in our mapping
        if len(sequence) == 2:
            if sequence in chromatic_mapping:
                mapped_sequence.append([chromatic_mapping.get(sequence)])
            # Only single nucleotides in our mapping
            else:
                mapped_sequence.append([chromatic_mapping.get(sequence[:1])])
                mapped_sequence.append([chromatic_mapping.get(sequence[1:2])])
        # Only single nucleotid in our mapping
        else:
            mapped_sequence.append([chromatic_mapping.get(sequence)])

    return mapped_sequence, ""  # No leftover, return empty string

def descript_chromatic():
    """
    Returns description of chromatic mapping algorithm.
    """
    return chromatic_description