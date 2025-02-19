export const fetchPhHistory = async () => {
    try {
        const response = await fetch("http://localhost:3000/api/ph-history");
        return await response.json();
    } catch (error) {
        console.error("Error fetching pH data:", error);
        return [];
    }
};