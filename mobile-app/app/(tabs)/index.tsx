import { Text, View, StyleSheet, Dimensions, ScrollView } from "react-native";
import { useFakeData } from "./fakeDataContext";
import React, { useEffect, useState } from "react";
import { LineChart } from "react-native-chart-kit";
type phDataPoints = {
  ph: string;
  time: string;
};

export default function Index() {
  const { fakeReceivedData } = useFakeData();
  const [pHDataAtTime, setPHDataAtTime] = useState<{
    ph: string;
    time: string;
  } | null>(null);
  const phData: phDataPoints[] = [];
  const chartData = phData.map((item) => parseFloat(item.ph)); // Convert to number
  const chartLabels = phData.map((item) => item.time);

  useEffect(() => {
    let time = getCurrentTime();
    if (fakeReceivedData !== "") {
      setPHDataAtTime({ ph: fakeReceivedData, time: time });
    }

    console.log(pHDataAtTime);
    if (pHDataAtTime) {
      phData.push(pHDataAtTime);
      console.log(phData);
    }
  }, [fakeReceivedData]);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString();
  };

  return (
    // <ScrollView style={{ padding: 20, backgroundColor: "white" }}>
    //   {" "}
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
            datasets: [
              { data: chartData, color: () => "black", strokeWidth: 2 },
            ],
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
      <View style={styles.summary}>
        <Text style={styles.text}>Summary of All Statistics</Text>
      </View>
    </View>
    // </ScrollView>
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
  graph: {
    height: "35%",
    width: "90%",
    margin: 12,
    borderWidth: 1,
    borderColor: "#ccc",
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
