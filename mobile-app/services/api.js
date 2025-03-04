const BACKEND_BASE_URL = "http://10.20.98.166:3000";

export const fetchPhHistory = async () => {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/ph-history`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching pH data:", error);
        return [];
    }
};

export const savePhData = async (ph) => {
    console.log("Saving pH data:", ph);
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/ph-data`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ ph }),
        });

        const responseData = await response.json(); 

        if (!response.ok) {
            throw new Error(`Network response error: ${responseData.message}`);
        }

        return responseData;
    } catch (error) {
        console.error("Error saving pH data:", error);
        return { message: "Error saving pH data", error: error.message };
    }
};
