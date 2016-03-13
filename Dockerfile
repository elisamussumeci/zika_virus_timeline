FROM debian

RUN apt-get update
RUN apt-get install -y git python-pip

# Clone code
RUN git clone https://github.com/elisamussumeci/zika_virus_timeline.git /srv/zika_virus_timeline/

# Install python deps
# We need --no-clean because of the way Docker.io's filesystem works. When pip
# tries to remove the build directory, it raises an error, saying the file was
# not found. After the RUN command finishes (it was commited), removing the
# directory works fine.
RUN pip install --no-clean -r /srv/zika_virus_timeline/requirements.txt

EXPOSE 8000
CMD ["python", "/srv/zika_virus_timeline/app.py"]
