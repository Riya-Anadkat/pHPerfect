import { Text, View, StyleSheet, Dimensions, ScrollView } from "react-native";
import { useData } from "./dataContext";
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
  const { receivedData } = useData();
  const [phData, setPhData] = useState<phDataPoints[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [trend, setTrend] = useState<Trend | null>(null);

  useEffect(() => {
    if (receivedData !== "") {
      const time = getCurrentTime();
      const newEntry = { ph: receivedData, time };

      setPhData((prevData) => {
        let updatedData = [...prevData, newEntry];

        if (updatedData.length > 4) {
          updatedData.shift();
        }

        return updatedData;
      });
    }
  }, [receivedData]);

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
    <ScrollView style={styles.container}>
      <View style={styles.currentStats}>
        <Text style={styles.currentStatsText}>
          Current pH: {receivedData} pH
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your pH Levels Over Time</Text>
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
          style={styles.chartStyle}
        />
      </View>
      {trend && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trendline</Text>
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
            style={styles.chartStyle}
          />
        </View>
      )}
      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary of All Statistics</Text>
          <View style={styles.row}>
            <Text style={styles.statsText}>
              Mean pH: {stats.mean.toFixed(2)}
            </Text>
            <Text style={styles.statsText}>Median pH: {stats.median}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.statsText}>Min pH: {stats.min}</Text>
            <Text style={styles.statsText}>Max pH: {stats.max}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.statsText}>Range: {stats.range}</Text>
            <Text style={styles.statsText}>
              Std Dev: {stats.stdDev.toFixed(2)}{" "}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7E7E7",
    padding: 16,
  },
  section: {
    marginBottom: 20,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  currentStats: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    backgroundColor: "#EC9595",
    borderRadius: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
  },
  currentStatsText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    padding: 3,
  },
  statsText: {
    color: "#000",
    fontWeight: "400",
    fontSize: 18,
    padding: 2,
  },
  chartStyle: {
    marginVertical: 0,
    borderRadius: 10,
    marginLeft: 0,
    marginRight: 20,
    marginTop: 20,
    marginBottom: 0,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-evenly",
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
