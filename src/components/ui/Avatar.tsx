import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks';

import { Text } from './Text';

type AvatarProps = {
  name: string;
  /** One of `avatarColors` from the theme tokens. */
  color: string;
  size?: number;
};

/** Coloured circle with the first letter of a name. The initial comes from the name (17). */
export function Avatar({ name, color, size = 40 }: AvatarProps) {
  return (
    <View
      style={[
        styles.avatar,
        { backgroundColor: color, width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text variant="bodyMedium" style={{ color: '#FFFFFF', fontSize: size * 0.42 }}>
        {name.slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}

type AvatarStackProps = {
  people: { name: string; color: string }[];
  size?: number;
};

/** Overlapping avatars, as in the 03 header. */
export function AvatarStack({ people, size = 36 }: AvatarStackProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.stack}>
      {people.map((person, index) => (
        <View
          key={`${person.name}-${index}`}
          style={{
            marginLeft: index === 0 ? 0 : -size * 0.3,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: colors.background,
          }}
        >
          <Avatar name={person.name} color={person.color} size={size} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  stack: { flexDirection: 'row', alignItems: 'center' },
});
