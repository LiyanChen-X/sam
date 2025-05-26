import axios, {
	type AxiosInstance,
	type AxiosRequestConfig,
	type AxiosResponse,
} from "axios";

// HTTP client class
export class HttpClient {
	private client: AxiosInstance;

	constructor(baseURL = "") {
		this.client = axios.create({
			baseURL,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	// Type-safe GET method
	async get<T>(
		url: string,
		params?: Record<string, unknown>,
		config?: AxiosRequestConfig,
	): Promise<T> {
		const response: AxiosResponse<T> = await this.client.get(url, {
			...config,
			params,
		});

		return response.data;
	}

	// Type-safe POST method
	async post<T, D = unknown>(
		url: string,
		data?: D,
		config?: AxiosRequestConfig,
	): Promise<T> {
		const response: AxiosResponse<T> = await this.client.post(
			url,
			data,
			config,
		);

		return response.data;
	}
}

// Create and export a default instance
const api = new HttpClient();
export default api;
