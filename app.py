from flask import Flask, render_template, Response
import os
import datetime
import json

app = Flask(__name__)
APP_ROOT = os.path.dirname(os.path.abspath(__file__))   # refers to application_top
APP_STATIC = os.path.join(APP_ROOT, 'static')

print APP_STATIC


def fix_abstract(art):
    if 'Abstract' not in art['MedlineCitation']['Article'] or art['MedlineCitation']['Article']['Abstract'] == "":
        art['MedlineCitation']['Article']['Abstract'] = {'AbstractText':  " "}
    else:
        art['MedlineCitation']['Article']['Abstract']['AbstractText'] = art['MedlineCitation']['Article']['Abstract']['AbstractText'][0]

    return art

@app.route("/")
def root():
    return render_template('pages/indextimeline.html')

@app.route('/pub1.jsonp')
def json_timeline():
    data = ''
    with open(os.path.join(APP_STATIC, 'pub1.json')) as f:
        data = data + f.read()
    articles = json.loads(data)

    for art in articles:
        art = fix_abstract(art)
        date = art['MedlineCitation']['Article']['ArticleDate']
        if date == []:
            art['MedlineCitation']['Article']['ArticleDate'] = datetime.date(2016, 5, 1)

        else:
            art['MedlineCitation']['Article']['ArticleDate'] = datetime.date(int(date[0].get('Year', 2016)),
                                                                             int(date[0].get('Month', 1)),
                                                                             int(date[0].get('Day', 1))).strftime("%Y,%m,%d")

    dados = render_template('pages/timeline.json', busca='Zika Virus', articles=articles)
    return Response(dados, mimetype='application/json')

@app.errorhandler(500)
def page_not_found(e):
    return e, 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000, debug=True)
