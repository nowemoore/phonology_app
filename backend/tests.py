from script import find_minimum_features
from script import find_phonemes_by_features

# should return [voice -] 
alphabet_phonemes = ['p', 'b', 't', 'd', 'k', 'g']
target_phonemes = ['p', 't', 'k']

result = find_minimum_features(alphabet_phonemes, target_phonemes, 'backend/ft.csv')
print("Result:", result)

# should return [rnd -] and [lab +]
alphabet_phonemes = ['p', 'b', 't', 'd', 'k', 'g']
target_phonemes = ['p', 'b']

result = find_minimum_features(alphabet_phonemes, target_phonemes, 'backend/ft.csv')
print("Result:", result)

# should return None
alphabet_phonemes = ['p', 'b', 't', 'd', 'k', 'g', 'n', 'm']
target_phonemes = ['t', 'm']

result = find_minimum_features(alphabet_phonemes, target_phonemes, 'backend/ft.csv')
print("Result:", result)

# should return m and n
alphabet_phonemes = ['p', 'b', 't', 'd', 'k', 'g', 'n', 'm']
target_features = [("nas", "+")]

result = find_phonemes_by_features(alphabet_phonemes, target_features, 'backend/ft.csv')
print("Result:", result)