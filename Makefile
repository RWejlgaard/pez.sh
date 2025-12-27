dev:
	@python3 -m http.server -p 8000

publish:
	@ssh root@helsinki-a -- "cd /srv/pez.sh; rm -rf *"
	@scp -r ./* root@helsinki-a:/srv/pez.sh/
	@ssh root@helsinki-a -- "chmod -R 777 /srv/pez.sh/*"