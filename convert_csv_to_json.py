import pandas as pd
import json

df = pd.read_csv("UserData.csv")

json_data = df.values.tolist()

with open("UserData.json", "w") as f:
    json.dump(json_data, f, indent=4)

print("CSV converted to JSON successfully!")
