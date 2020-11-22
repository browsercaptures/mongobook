import fileinput
import json
import chess
import chess.variant
import time

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
        origvariant = variant
        if variant == "kingOfTheHill":
            variant = "KOTH"
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
            for san in blob["moves"].split(" ")[:40]:
                fenBeforeMove = variantBoard.fen()
                move = variantBoard.parse_san(san)
                uci = move.uci()
                variantBoard.push(move)
                print("bookmove", origvariant, uci, san, gameid, result, fenBeforeMove, flush=True)
            time.sleep(1)
        else:
            print("nomoves", flush=True)
