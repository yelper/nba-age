__author__ = 'sarikaya'


import os
import csv
import json

def parseFile(file):
    with open(file, 'rb') as f:
        r = [{k: v for k,v in row.items()} for row in csv.DictReader(f)]

        for row in r:
            # playerName, playerID = row['Player'].split('\\')
            # row['bbref_id'] = playerID
            # row['Player'] = playerName

            row["origin_country"] = row[""]
            del row[""]

            row["number"] = row["No."]
            del row["No."]

            row["birthdate"] = row["Birth Date"]
            del row["Birth Date"]

        return r

if __name__ == "__main__":
    stats = {}

    for file in os.listdir("players"):
        if file.endswith(".csv"):
            stats[file.split('.')[0]] = parseFile(os.path.join('players', file))

    with open("teams.csv", 'r') as f:
        r = [{k: v for k,v in row.items()} for row in csv.DictReader(f)]
        for team in r:
            if team['id'] != "other":
                team['players'] = stats[team['id']]

    r[:] = [x for x in r if x['id'] != 'other']

    f = open('players.json', 'w')
    json.dump(r, f)
