import { Text, View, StyleSheet } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <View style={styles.current_stats}>
        <Text style={styles.text}>Current Statistics</Text>
      </View>
      <View style={styles.graph}>
        <Text style={styles.text}>Timeline Graph</Text>
      </View>
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
