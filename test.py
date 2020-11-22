import fileinput

print("init", flush=True)


for line in fileinput.input():
    line = line.rstrip()
    if line == "start":
        print("started", flush=True)
    else:
        print("got", line, flush=True)
