import { Text, View, StyleSheet, Dimensions } from "react-native";
import { useFakeData } from "./fakeDataContext";
import React, { useEffect, useState } from "react";
import { LineChart } from "react-native-chart-kit";

type phDataPoints = {
  ph: string;
  time: string;
};

export default function Index() {
  const { fakeReceivedData } = useFakeData();
  const [phData, setPhData] = useState<phDataPoints[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [trend, setTrend] = useState<Trend | null>(null);

  useEffect(() => {
    if (fakeReceivedData !== "") {
      const time = getCurrentTime();
      const newEntry = { ph: fakeReceivedData, time };

      setPhData((prevData) => {
        let updatedData = [...prevData, newEntry];

        // If the array has more than 12 entries, remove the oldest one
        if (updatedData.length > 12) {
          updatedData.shift(); // Remove first element (oldest)
        }

        return updatedData;
      });
    }
  }, [fakeReceivedData]);

  // useEffect(() => {
  //   if (fakeReceivedData !== "") {
  //     const time = getCurrentTime();
  //     const newEntry = { ph: fakeReceivedData, time: time };

  //     setPhData((prevData) => [...prevData, newEntry]); // Append new data

  //     if size of prevData is > 12
  //     remove prevData[0]
  //   }
  // }, [fakeReceivedData]);

  //  // Reset phData every 5 minutes
  //  useEffect(() => {
  //   const resetInterval = setInterval(() => {
  //     setPhData([]); // Clear the array
  //   }, 300000); // 5 minutes in milliseconds

  //   return () => clearInterval(resetInterval); // Cleanup on unmount
  // }, []);

    // Compute statistics and trend when phData changes
  useEffect(() => {
      if (phData.length > 0) {
        setStats(calculateStats(phData));
        setTrend(calculateTrend(phData));
      }
  }, [phData]);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString();
  };

  const chartData = phData.map((item) => parseFloat(item.ph)); // Convert to number
  const chartLabels = phData.map((item) => item.time);
  const trendData = phData.map((_, index) => 
    trend ? trend.slope * index + trend.intercept : 0
  );


  console.log("chartData:", chartData);
  console.log("chartLabels:", chartLabels);

  type Stats = {
    mean: number;
    median: number;
    min: number;
    max: number;
    range: number;
    stdDev: number;
  };
  
  const calculateStats = (data: phDataPoints[]): Stats | null => {
    if (!data.length) return null;
    const values = data.map((item) => parseFloat(item.ph));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length
    );
    return { mean, median, min, max, range, stdDev };
  };
  
  type Trend = {
    slope: number;
    intercept: number;
  };
  
  const calculateTrend = (data: phDataPoints[]): Trend | null => {
    if (data.length < 2) return null;
    const x = data.map((_, index) => index);
    const y = data.map((item) => parseFloat(item.ph));
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi ** 2, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
  };
  

  return (
    <View style={styles.container}>
      <View style={styles.current_stats}>
        <Text style={styles.text}>Current Statistics</Text>
        <Text style={styles.text}>{fakeReceivedData} pH</Text>
      </View>
      {/* pH Levels Over Time */}
      <View style={{ marginVertical: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: "bold", color: "black" }}>
          pH Levels Over Time
        </Text>
        <LineChart
          data={{
            labels: chartLabels,
            datasets: [{ data: chartData, color: () => "black", strokeWidth: 2 }],
          }}
          width={Dimensions.get("window").width - 40}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          yAxisInterval={1}
          chartConfig={{
            backgroundColor: "white",
            backgroundGradientFrom: "white",
            backgroundGradientTo: "white",
            decimalPlaces: 2,
            color: () => "black",
            labelColor: () => "black",
            style: { borderRadius: 16 },
          }}
          bezier
          style={{ marginVertical: 8, borderRadius: 16 }}
        />
      </View>
      
      {/* Trendline (Linear Regression) */}
    {trend && (
      <View style={{ marginVertical: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: "bold", color: "black" }}>Trendline (Linear Regression)</Text>
        <Text style={{ color: "black" }}>
          Trend Line Equation: pH = {trend.slope.toFixed(2)} * time + {trend.intercept.toFixed(2)}
        </Text>
        <LineChart
          data={{
            labels: chartLabels,
            datasets: [{ data: trendData, color: () => "black", strokeWidth: 2 }],
          }}
          width={Dimensions.get("window").width - 40}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          yAxisInterval={1}
          chartConfig={{
            backgroundColor: "white",
            backgroundGradientFrom: "white",
            backgroundGradientTo: "white",
            decimalPlaces: 2,
            color: () => "black",
            labelColor: () => "black",
            style: { borderRadius: 16 },
          }}
          bezier
          style={{ marginVertical: 8, borderRadius: 16 }}
        />
      </View>
    )}

      <View style={styles.summary}>
        <Text style={styles.text}>Summary of All Statistics</Text>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7E7E7",
    alignItems: "flex-start",
    padding: 10,
  },
  text: {
    color: "#000",
    justifyContent: "center",
    fontWeight: "400",
    fontSize: 18,
    padding: 10,
  },
  current_stats: {
    height: "15%",
    width: "90%",
    margin: 12,
    borderWidth: 1,
    borderColor: "#EC9595",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  summary: {
    height: "38%",
    width: "90%",
    margin: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
});



// import { Text, View, StyleSheet, Dimensions, ScrollView } from "react-native";
// import { useFakeData } from "./fakeDataContext";
// import React, { useEffect, useState } from "react";
// import { LineChart } from "react-native-chart-kit";
// type phDataPoints = {
//   ph: string;
//   time: string;
// };

// export default function Index() {
//   const { fakeReceivedData } = useFakeData();
//   const [pHDataAtTime, setPHDataAtTime] = useState<{
//     ph: string;
//     time: string;
//   } | null>(null);
//   const phData: phDataPoints[] = [];
//   const chartData = phData.map((item) => parseFloat(item.ph)); // Convert to number
//   const chartLabels = phData.map((item) => item.time);

//   useEffect(() => {
//     let time = getCurrentTime();
//     if (fakeReceivedData !== "") {
//       setPHDataAtTime({ ph: fakeReceivedData, time: time });
//     }

//     console.log(pHDataAtTime);
//     if (pHDataAtTime) {
//       phData.push(pHDataAtTime);
//       console.log(phData);
//     }
//   }, [fakeReceivedData]);

//   const getCurrentTime = () => {
//     const now = new Date();
//     return now.toLocaleTimeString();
//   };

//   console.log("chartData:", chartData);
//   console.log("chartLabels", chartLabels);
//   return (
//     // <ScrollView style={{ padding: 20, backgroundColor: "white" }}>
//     //   {" "}
//     <View style={styles.container}>
//       <View style={styles.current_stats}>
//         <Text style={styles.text}>Current Statistics</Text>
//         <Text style={styles.text}>{fakeReceivedData} pH</Text>
//       </View>
//       {/* pH Levels Over Time */}
//       <View style={{ marginVertical: 10 }}>
//         <Text style={{ fontSize: 16, fontWeight: "bold", color: "black" }}>
//           pH Levels Over Time
//         </Text>
//         <LineChart
//           data={{
//             labels: chartLabels,
//             datasets: [
//               { data: chartData, color: () => "black", strokeWidth: 2 },
//             ],
//           }}
//           width={Dimensions.get("window").width - 40}
//           height={220}
//           yAxisLabel=""
//           yAxisSuffix=""
//           yAxisInterval={1}
//           chartConfig={{
//             backgroundColor: "white",
//             backgroundGradientFrom: "white",
//             backgroundGradientTo: "white",
//             decimalPlaces: 2,
//             color: () => "black",
//             labelColor: () => "black",
//             style: { borderRadius: 16 },
//           }}
//           bezier
//           style={{ marginVertical: 8, borderRadius: 16 }}
//         />
//       </View>
//       <View style={styles.summary}>
//         <Text style={styles.text}>Summary of All Statistics</Text>
//       </View>
//     </View>
//     // </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#E7E7E7",
//     alignItems: "flex-start",
//     padding: 10,
//   },
//   text: {
//     color: "#000",
//     justifyContent: "center",
//     fontWeight: "400",
//     fontSize: 18,
//     padding: 10,
//   },
//   current_stats: {
//     height: "15%",
//     width: "90%",
//     margin: 12,
//     borderWidth: 1,
//     borderColor: "#EC9595",
//     borderRadius: 5,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   graph: {
//     height: "35%",
//     width: "90%",
//     margin: 12,
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 5,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   summary: {
//     height: "38%",
//     width: "90%",
//     margin: 12,
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 5,
//     alignItems: "center",
//     justifyContent: "center",
//   },
// });
