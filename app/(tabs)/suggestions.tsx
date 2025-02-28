import { Text, View, StyleSheet, Dimensions, FlatList } from "react-native";

export default function SuggestionsScreen() {
  return (
    <View style={styles.container}>
      {Array.from({ length: 15 }, (_, i) => (
        <View key={i} style={styles.item}>
          <Text style={styles.text}>Item {i + 1}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flex: 1,
    flexWrap: "wrap",
    justifyContent: "center",
    paddingTop: 30,
    padding: 10,
    backgroundColor: "#E7E7E7",
  },
  item: {
    width: 100,
    height: 100,
    backgroundColor: "#EC9595",
    justifyContent: "center",
    alignItems: "center",
    margin: 10,
    borderRadius: 8,
  },
  text: {
    color: "white",
    fontWeight: "bold",
  },
});
