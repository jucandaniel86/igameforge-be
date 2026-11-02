"""Extract INSERT rows from the legacy dump without executing SQL.

Usage: python3 scripts/extract-game-templates.py dump.sql import-data/games.json
Values are preserved; only is_fun is renamed to demo.
"""

import json
import re
import sys
from collections import Counter
from pathlib import Path


def read_rows(text, start):
    pos = start
    escapes = {"0": "\0", "n": "\n", "r": "\r", "t": "\t", "b": "\b", "Z": "\x1a"}

    def whitespace():
        nonlocal pos
        while pos < len(text) and text[pos].isspace():
            pos += 1

    while True:
        whitespace()
        if text[pos] != "(":
            raise ValueError(f"Expected row at offset {pos}")
        pos += 1
        row = []
        while True:
            whitespace()
            if text[pos] == "'":
                pos += 1
                value = []
                while pos < len(text):
                    char = text[pos]
                    pos += 1
                    if char == "\\":
                        char = text[pos]
                        pos += 1
                        value.append(escapes.get(char, char))
                    elif char == "'":
                        if pos < len(text) and text[pos] == "'":
                            value.append("'")
                            pos += 1
                        else:
                            break
                    else:
                        value.append(char)
                else:
                    raise ValueError("Unterminated SQL string")
                row.append("".join(value))
            else:
                begin = pos
                while pos < len(text) and text[pos] not in ",)":
                    pos += 1
                token = text[begin:pos].strip()
                if token.upper() == "NULL":
                    row.append(None)
                elif re.fullmatch(r"-?\d+", token):
                    row.append(int(token))
                else:
                    raise ValueError(f"Unsupported SQL value: {token!r}")
            whitespace()
            delimiter = text[pos]
            pos += 1
            if delimiter == ")":
                break
            if delimiter != ",":
                raise ValueError(f"Unexpected delimiter at {pos - 1}")
        yield row
        whitespace()
        delimiter = text[pos]
        pos += 1
        if delimiter == ";":
            return
        if delimiter != ",":
            raise ValueError(f"Unexpected row delimiter at {pos - 1}")


def extract(text):
    games = []
    pattern = r"INSERT INTO `games`\s*\(([^)]+)\)\s*VALUES\s*"
    for match in re.finditer(pattern, text):
        columns = re.findall(r"`([^`]+)`", match[1])
        for row in read_rows(text, match.end()):
            if len(row) != len(columns):
                raise ValueError("Column count does not match row")
            game = dict(zip(columns, row))
            game["demo"] = game.pop("is_fun")
            games.append(game)
    if not games:
        raise ValueError("No game rows found")
    return games


if __name__ == "__main__":
    source, destination = map(Path, sys.argv[1:])
    games = extract(source.read_text(encoding="utf-8"))
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(games, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    duplicates = {key: count for key, count in Counter(g["game_id"] for g in games).items() if count > 1}
    print(json.dumps({"rows": len(games), "duplicate_game_ids": duplicates,
                      "demo_values": dict(Counter(g["demo"] for g in games)),
                      "output": str(destination)}, indent=2))
