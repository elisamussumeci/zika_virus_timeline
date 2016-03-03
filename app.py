from flask import Flask, render_template, Response
import os
import datetime
import json

app = Flask(__name__)
APP_ROOT = os.path.dirname(os.path.abspath(__file__))   # refers to application_top
APP_STATIC = os.path.join(APP_ROOT, 'static')

print APP_STATIC


def fix_empty_summary(art):
    if 'summary' not in art or art['summary'] == "":
        art['summary'] = " "
    return art

@app.route("/")
def root():
    return render_template('pages/indextimeline.html')

@app.route('/data.jsonp')
def json_timeline():
    data = ''
    with open(os.path.join(APP_STATIC, 'data.json')) as f:
        data = data + f.read()
    articles = json.loads(data)

    for art in articles:
        art['published'] = datetime.date.fromtimestamp(art['published']['$date']/1000.).strftime("%Y,%m,%d")
        art = fix_empty_summary(art)

    dados = render_template('pages/timeline.json', busca='Zika Virus', articles=articles)
    return Response(dados, mimetype='application/json')

@app.errorhandler(500)
def page_not_found(e):
    return e, 500

if __name__ == "__main__":
    app.run(port=8000, debug=True)