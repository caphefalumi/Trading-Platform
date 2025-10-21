import apiClient from "./api";

export async function getCryptoPrices(symbols = ["BTC", "ETH"]) {
  try {
    const response = await apiClient.get("/crypto/prices", {
      params: { symbol: symbols.join(",") },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching crypto prices:", error);
    return {};
  }
}
