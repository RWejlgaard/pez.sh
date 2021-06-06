push:
	flutter build web
	rm -rf ./nginx
	cp -a ./build/web ./nginx
	cp ./cv.pdf ./nginx/cv.pdf
	gcloud builds submit . --tag=gcr.io/rwejlgaard/pez.sh:latest --no-cache
	gcloud run deploy pezsh --image=gcr.io/rwejlgaard/pez.sh:latest --platform=managed --region europe-west1
default: push