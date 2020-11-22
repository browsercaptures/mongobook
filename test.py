import fileinput
import json

print("init", flush=True)


for line in fileinput.input():
    line = line.rstrip()
    if line == "start":
        print("started", flush=True)
    elif line == "end":
        break
    else:
        blob = json.loads(line)
        print("got", blob["variant"], flush=True)
