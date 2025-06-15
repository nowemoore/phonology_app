import pandas as pd
from itertools import combinations

def find_minimum_features(alphabet_phonemes, target_phonemes, csv_file='ft.csv'):
    """
    Find the minimum set of features needed to describe target phonemes given an alphabet.

    Args:
        alphabet_phonemes (list): List of phonemes in the language's alphabet
        target_phonemes (list): List of target phonemes to describe
        csv_file (str): Path to the CSV file containing phoneme features

    Returns:
        dict or None: Dictionary with 'solutions' key containing list of all minimal solutions,
                     each solution is a list of tuples (feature_name, value),
                     or None if no solution exists
    """
    # Load the phoneme feature data
    df = pd.read_csv(csv_file, encoding='utf-8')

    # Set the first column as index (phoneme names)
    df.set_index(df.columns[0], inplace=True)

    # Get feature columns, excluding 'type' column
    feature_columns = [col for col in df.columns.tolist() if col.lower() != 'type']

    # Check if all phonemes exist in the dataset
    missing_phonemes = set(alphabet_phonemes + target_phonemes) - set(df.index)
    if missing_phonemes:
        raise ValueError(f"Phonemes not found in dataset: {missing_phonemes}")

    # Filter data for alphabet and target phonemes
    alphabet_data = df.loc[alphabet_phonemes]
    target_data = df.loc[target_phonemes]

    # Find features that can potentially describe the target group
    valid_features = []

    for feature in feature_columns:
        target_values = target_data[feature].values

        # Skip if any target phoneme has -1 for this feature
        if -1 in target_values:
            continue

        # Check if all target phonemes have the same value for this feature
        if len(set(target_values)) == 1:
            # Check if this feature value distinguishes targets from non-targets in alphabet
            target_value = target_values[0]
            non_target_phonemes = [p for p in alphabet_phonemes if p not in target_phonemes]

            if non_target_phonemes:
                non_target_data = df.loc[non_target_phonemes]
                non_target_values = non_target_data[feature].values

                # Feature is valid if not all non-targets have the same value as targets
                if not all(val == target_value for val in non_target_values):
                    valid_features.append(feature)
            else:
                # If no non-targets, any consistent feature is valid
                valid_features.append(feature)

    # Find minimum combination of features that uniquely identifies the target group
    def is_sufficient_combination(feature_combo):
        """Check if a combination of features uniquely identifies the target phonemes"""
        target_signatures = set()

        # Get signatures for target phonemes
        for phoneme in target_phonemes:
            signature = tuple(target_data.loc[phoneme, feature] for feature in feature_combo)
            target_signatures.add(signature)

        # Check if any non-target phoneme has the same signature
        non_target_phonemes = [p for p in alphabet_phonemes if p not in target_phonemes]

        for phoneme in non_target_phonemes:
            signature = tuple(alphabet_data.loc[phoneme, feature] for feature in feature_combo)
            if signature in target_signatures:
                return False

        return True

    # Try combinations of increasing size until we find sufficient ones
    for size in range(1, len(valid_features) + 1):
        solutions = []

        for combo in combinations(valid_features, size):
            if is_sufficient_combination(combo):
                # Create feature-value pairs for this solution
                solution = []
                for feature in combo:
                    # Get the shared value for this feature among target phonemes
                    shared_value = target_data[feature].iloc[0]  # All targets have same value
                    value_symbol = '+' if shared_value == 1 else '-'
                    solution.append((feature, value_symbol))
                solutions.append(solution)

        # If we found solutions at this size, return all of them (they're minimal)
        if solutions:
            if len(solutions) == 1:
                return {
                    'solutions': solutions,
                    'message': f"Unique minimal solution found with {size} feature(s)"
                }
            else:
                return {
                    'solutions': solutions,
                    'message': f"Multiple minimal solutions found with {size} feature(s) each"
                }

    # If no combination works, return None (no solution)
    return None

def find_phonemes_by_features(alphabet_phonemes, feature_specifications, csv_file='ft.csv'):
    """
    Find phonemes in the alphabet that match the given feature specifications.

    Args:
        alphabet_phonemes (list): List of phonemes in the language's alphabet
        feature_specifications (list): List of tuples (feature_name, value) where value is '+' or '-'
        csv_file (str): Path to the CSV file containing phoneme features

    Returns:
        list: List of phonemes that match ALL the specified features
    """
    # Load the phoneme feature data
    df = pd.read_csv(csv_file, encoding='utf-8')
    
    # Set the first column as index (phoneme names)
    df.set_index(df.columns[0], inplace=True)
    
    # Filter data for alphabet phonemes only
    alphabet_data = df.loc[alphabet_phonemes]
    
    # Start with all alphabet phonemes as candidates
    matching_phonemes = set(alphabet_phonemes)
    
    # Apply each feature specification as a filter
    for feature_name, value_symbol in feature_specifications:
        # Skip 'type' column and unknown features
        if feature_name.lower() == 'type' or feature_name not in df.columns:
            continue
            
        # Convert '+' to 1, '-' to 0
        target_value = 1 if value_symbol == '+' else 0
        
        # Find phonemes that have this feature value
        feature_matches = set()
        for phoneme in matching_phonemes:
            if alphabet_data.loc[phoneme, feature_name] == target_value:
                feature_matches.add(phoneme)
        
        # Update matching phonemes to intersection
        matching_phonemes = matching_phonemes.intersection(feature_matches)
    
    return list(matching_phonemes)

def get_all_features(csv_file='ft.csv'):
    """
    Get all feature names from the CSV file, excluding 'type' column.
    
    Args:
        csv_file (str): Path to the CSV file containing phoneme features
        
    Returns:
        list: List of all feature names (excluding phoneme names and type)
    """
    df = pd.read_csv(csv_file, encoding='utf-8')
    # Return all columns except the first one (phoneme names) and 'type' column
    feature_columns = [col for col in df.columns[1:].tolist() if col.lower() != 'type']
    return feature_columns