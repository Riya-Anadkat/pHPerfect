import { StyleSheet } from 'react-native';
import React, { useEffect, useState } from "react";
import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { fetchPhHistory } from "../../services/api";

export default function TabOneScreen() {
  const [phData, setPhData] = useState([{"id":1,"ph_value":2,"timestamp":"2025-02-19T18:16:43.000Z"},{"id":2,"ph_value":5,"timestamp":"2025-02-19T18:16:43.000Z"}]);

  useEffect(() => {
    const getData = async () => {
        const data = await fetchPhHistory();
        setPhData(data);
    };
    getData();
  }, []);


  return (
    <View style={styles.container}>
      <Text style={styles.title}>{JSON.stringify(phData)}</Text>

      <Text style={styles.title}>Tab One</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <EditScreenInfo path="app/(tabs)/index.tsx" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
