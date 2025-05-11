binary_mapping = {
    "000": 60, # C
    "001": 62, # D
    "010": 64, # E
    "100": 65, # F
    "011": 67, # G
    "110": 69, # A
    "101": 71, # H
    "111": 72, # C
    "A": "00",
    "C": "01",
    "G": "10",
    "T": "11",
}

binary_description = "The algorithm parses lines from a file containing nucleotide sequences into triplets. Each of the four nucleotides is assigned a \
                        unique 2-bit binary code. The resulting 6-bit string is then split into two 3-bit segments. Each 3-bit binary value is mapped to \
                        a note."

def map_binary(sequence, is_end):
    """
    Convert sequence of nucleotides into 2D notes array. The algorithm first splits the sequence into triplets and then converts them
    to binary numbers based on the above dictionary. The resulting binary strings are parsed into 3-bit segments and mapped to notes.
    It returns the converted sequence and any leftover characters. In case when end of file flag is set to true, it converts leftover 
    characters too.
    
    Arguments:
        sequence (str): Lines of file (Commonly one line) containing nucleotides.
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
            
            binary_string = ""
            # Conversion of triplet into binary string
            for nucleotide in triplet:
                binary_string += binary_mapping[nucleotide]

            # Split the triplet into halves
            first_half = binary_string[:3]
            second_half = binary_string[3:]

            # Map them to notes using dictionary
            first_note = binary_mapping.get(first_half)
            second_note = binary_mapping.get(second_half)

            # Append the result to the output sequence
            if first_note is not None:
                mapped_sequence.append([first_note])
            if second_note is not None:
                mapped_sequence.append([second_note])
            i += 3 # Move to the next triplet
    # Process leftover at the end of file - could be length of 2 or 1
    else:
        # Pad the leftover with A to length of 3
        padded = sequence + "A" * (3 - len(sequence))

        binary_string = ""
        # Conversion of triplet into binary string
        for nucleotide in padded:
                binary_string += binary_mapping[nucleotide]

        # Split the triplet into halves
        first_half = binary_string[:3]
        second_half = binary_string[3:]

        # Map them to notes using dictionary
        first_note = binary_mapping.get(first_half)
        second_note = binary_mapping.get(second_half)

        # Append the result to the output sequence
        if first_note is not None:
            mapped_sequence.append([first_note])
        if second_note is not None:
            mapped_sequence.append([second_note])

    return mapped_sequence, ""  # No leftover, return empty string

def descript_binary():
    """
    Returns description of binary mapping algorithm.
    """
    return binary_description

def get_mapping_binary():
    """
    Returns mapping of binary algorithm.
    """
    return binary_mapping