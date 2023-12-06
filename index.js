const dotenv = require("dotenv");
const OpenAPIResponseValidator = require("openapi-response-validator").default;

// import the OpenAPI spec file from a path
const apispec = require("./venus.json");

dotenv.config();

const BASE_URL = "https://dev.api.apollo-group.io/venus-api";
const SIGN_IN_ENDPOINT = "/auth/signin";
const INVESTOR_FITLER_ENDPOINT = "/database/investment-firm/filter";
const DEFAULT_FILTERS = {
	sort: { direction: "DESC", property: "threeMoDealCount" },
	filter: {
		general: {
			firm: {
				type: [
					{
						key: "accelerator-incubator",
						subTypes: [
							"large-batches",
							"regional-focus",
							"international",
							"sector-specialists",
							"studios",
							"other",
						],
					},
					{
						key: "angel",
						subTypes: [
							"hyperactive",
							"occasional",
							"venture-scouts",
							"angel-syndicates",
							"active",
						],
					},
					{ key: "family-office", subTypes: ["established", "emerging"] },
					{
						key: "corporate-vc",
						subTypes: ["innovation-funds", "financial-funds", "other"],
					},
					{
						key: "vc-firm",
						subTypes: [
							"sector-specialists",
							"pre-seed-specialists",
							"seed-specialists",
							"series-a-specialists",
							"micro-vcs",
							"other",
						],
					},
				],
			},
		},
		stage: {
			percentageInvestmentsByStage: {
				selectedStages: [
					"Pre-Seed",
					"Seed",
					"Series A",
					"Series B",
					"Series C",
					"Series C+",
				],
				portfolioInvestmentsPercentage: 1,
			},
		},
	},
	page: 2,
};

// the main function - authenticated the user, fetches the data from the API and validates the response against the loaded api spec file
async function main() {
	// authenticate user
	const cookies = await signin(
		process.env.AUTH_EMAIL,
		process.env.AUTH_PASSWORD
	);
	// fetch the API response to be validated
	const response = await makeAPICall(
		INVESTOR_FITLER_ENDPOINT,
		"POST",
		DEFAULT_FILTERS,
		cookies
	);

	// get the response spec from the API Spec JSON
	const APISpecResponses =
		apispec.paths[INVESTOR_FITLER_ENDPOINT].post.responses;
	const validator = new OpenAPIResponseValidator({
		responses: APISpecResponses,
		components: apispec.components,
	});

	// loop over the possible API responses
	for (let res of Object.keys(APISpecResponses)) {
		console.log("Validating response for:", res);
		// validate the response
		const validationErrors = validator.validateResponse(res, response);
		// if there are errors, log the error to the console
		if (validationErrors) {
			console.error(validationErrors.message);
			console.error(validationErrors.errors);
			continue;
		}
		// if response is validated without errors, log a success message
		console.log("API response is valid!");
	}
}

main();

async function signin(email, password) {
	console.log("Authenticating...");
	console.log({ email, password });
	const body = {
		formFields: [
			{ id: "email", value: email },
			{ id: "password", value: password },
		],
	};
	try {
		const response = await fetch(`${BASE_URL}${SIGN_IN_ENDPOINT}`, {
			headers: {
				"st-auth-mode": "cookie",
			},
			body: JSON.stringify(body),
			method: "POST",
		});
		console.log("Authenticated!");
		return response.headers.getSetCookie();
	} catch (err) {
		console.error(err);
	}
}

async function makeAPICall(endpoint, method, body, cookies) {
	console.log(`Fetching API response -- ${endpoint}`);
	try {
		const res = await fetch(`${BASE_URL}${endpoint}`, {
			headers: {
				cookie: `st-last-access-token-update=${new Date().getUTCMilliseconds()};${cookies}`,
			},
			body: JSON.stringify(body),
			method: method,
		});
		if (res.status > 299)
			throw new Error(`Failed to fetch data -- ${res.status}`);
		return await res.json();
	} catch (err) {
		console.error(err);
	}
}
