import fileinput
import json
import chess
import chess.variant

print("init", flush=True)

for line in fileinput.input():
    line = line.rstrip()
    if line == "start":
        print("started", flush=True)
    elif line == "end":
        break
    else:
        blob = json.loads(line)
        variant = blob["variant"]
        gameid = blob["id"]
        if variant == "chess960":
            variantBoard = chess.Board(chess960=True, fen=blob["initialFen"])
        elif variant == "standard":
            variantBoard = chess.Board()
        elif variant == "fromPosition":
            variantBoard = chess.Board(fen=blob["initialFen"])
        else:
            variantBoard = chess.variant.find_variant(variant)()
        if not blob["moves"] is None:
            result = 0.5
            if not blob.get("winner", None) is None:
                result = 1 if blob["winner"] == "white" else 0
            for san in blob["moves"].split(" ")[:10]:
                fenBeforeMove = variantBoard.fen()
                variantBoard.push_san(san)
                print("bookmove", gameid, san, result, fenBeforeMove, flush=True)
        else:
            print("nomoves", flush=True)
