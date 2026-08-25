import { StyleSheet, Text, View } from 'react-native';

export default function MesocyclesScreen() {
  return (
    <View style={styles.container}>
      <Text>Mesocycles</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
