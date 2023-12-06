# Validate API Response against API Spec

Simple POC for manually authenticating the API, fetching a response and validating it against the API spec JSON file

## How to use

1. Copy the venus.json file to the project root / or change the path at Line 3
2. add a .env file with the credentials like so:

```
AUTH_EMAIL=
AUTH_PASSWORD=
```

3. install package with `npm i`
4. run the `dev` script

The app will first authenticate using the creds provided, then make an API call the the investors filter API and validate it against the API spec doc
