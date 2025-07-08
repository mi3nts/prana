# basic example server

from flask import Flask, jsonify

app = Flask(__name__)
cozir = Cozir()

@app.route("/data")
def getData():
    with open("latestData.json", "r") as f:
        for line in f:
            data = json.loads(line)
    return jsonify({result})

if __name__ == "__main__":
    app.run(port=5000)
