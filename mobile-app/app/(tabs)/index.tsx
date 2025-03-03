import { Text, View, StyleSheet, Dimensions, ScrollView } from "react-native";
import { useFakeData } from "./fakeDataContext";
import React, { useEffect, useState } from "react";
import { LineChart } from "react-native-chart-kit";

type phDataPoints = {
  ph: string;
  time: string;
};

type Stats = {
  mean: number;
  median: number;
  min: number;
  max: number;
  range: number;
  stdDev: number;
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

        if (updatedData.length > 4) {
          updatedData.shift();
        }

        return updatedData;
      });
    }
  }, [fakeReceivedData]);

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

  const chartData = phData.map((item) => parseFloat(item.ph));
  const chartLabels = phData.map((item) => item.time);
  const trendData = phData.map((_, index) =>
    trend ? trend.slope * index + trend.intercept : 0
  );

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
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <View style={styles.currentStats}>
          <Text style={styles.text}>
            Current Statistics: {fakeReceivedData} pH
          </Text>
        </View>
        <Text style={styles.sectionTitle}>pH Levels Over Time</Text>
        <View style={styles.statsCard1}>
          <LineChart
            data={{
              labels: chartLabels,
              datasets: [
                { data: chartData, color: () => "black", strokeWidth: 2 },
              ],
            }}
            width={Dimensions.get("window").width - 50}
            height={230}
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
              style: { borderRadius: 16, paddingLeft: 0, paddingBottom: 0 },
              propsForLabels: {
                fontSize: 12,
              },
            }}
            bezier
            style={styles.chartStyle1}
          />
        </View>
        <Text style={styles.sectionTitle}>Trendline (Linear Regression)</Text>

        {trend && (
          <View style={styles.statsCard1}>
            {/* TODO: CHANGE THIS TITLE NOT USER FRIENDLY */}

            {/* <Text style={styles.text2}>
              {/* Trend Line Equation: pH = {trend.slope.toFixed(2)} * time +{" "} */}
            {/* {trend.intercept.toFixed(2)} */}
            {/* </Text> */}
            <LineChart
              data={{
                labels: chartLabels,
                datasets: [
                  { data: trendData, color: () => "black", strokeWidth: 2 },
                ],
              }}
              width={Dimensions.get("window").width - 50}
              height={230}
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
                style: {
                  borderRadius: 16,
                  paddingLeft: 0,
                  paddingBottom: 0,
                },
                propsForLabels: {
                  fontSize: 12,
                },
              }}
              bezier
              style={styles.chartStyle2}
            />
          </View>
        )}
        <Text style={styles.sectionTitle}>Summary of All Statistics</Text>
        {stats && (
          <View style={styles.statsCard2}>
            <View style={styles.row}>
              <Text style={styles.statsText}>
                Mean pH: {stats.mean.toFixed(2)}
              </Text>
              <Text style={styles.statsText}>Median pH: {stats.median}</Text>
              <Text style={styles.statsText}>
                Std Dev: {stats.stdDev.toFixed(2)}{" "}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.statsText}>Min pH: {stats.min}</Text>
              <Text style={styles.statsText}>Max pH: {stats.max}</Text>
              <Text style={styles.statsText}>Range: {stats.range}</Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7E7E7",
    alignItems: "flex-start",
    padding: 10,
  },
  scrollView: {
    flex: 1,
    padding: 15,
    backgroundColor: "#E7E7E7",
  },
  text: {
    color: "#fff",
    justifyContent: "center",
    fontWeight: "400",
    fontSize: 18,
    padding: 10,
  },
  text2: {
    color: "#000",
    // justifyContent: "center",
    fontWeight: "400",
    fontSize: 18,
    paddingBottom: 10,
    margin: 20,
  },
  statsText: {
    color: "#000",
    fontWeight: "400",
    fontSize: 18,
    padding: 2,
    marginLeft: 20,
  },
  currentStats: {
    height: "8%",
    width: "100%",
    backgroundColor: "#EC9595",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statsCard1: {
    height: "30%",
    width: "100%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    // marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statsCard2: {
    height: "15%",
    width: "100%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 8,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,

    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
    padding: 15,
  },
  chartStyle1: {
    marginVertical: 0,
    borderRadius: 10,
    marginLeft: 0,
    marginRight: 20,
    marginTop: 20,
    marginBottom: 0,
  },
  chartStyle2: {
    marginVertical: 0,
    borderRadius: 10,
    marginLeft: 0,
    marginTop: 20,
    marginRight: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  item: {
    flex: 1,
    padding: 10,
    margin: 5,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    alignItems: "center",
  },
});
