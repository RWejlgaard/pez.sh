push:
	gcloud builds submit . --tag=gcr.io/rwejlgaard/pez.sh:latest
	gcloud run deploy pezsh --image=gcr.io/rwejlgaard/pez.sh:latest --platform=managed --region europe-west1
default: push