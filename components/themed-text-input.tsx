import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, { useState } from 'react';
import { ReturnKeyTypeOptions, StyleSheet, TextInput, TextInputSubmitEditingEvent, View } from 'react-native';

interface SearchInputProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmitEditing?: (text: string) => void;
  returnKeyType?: ReturnKeyTypeOptions;
  placeholder?: string;
  children?: React.ReactNode; // тип для любых дочерних элементов React
}

const SearchInput: React.FC<SearchInputProps> = ({
  value = "",
  onChangeText = () => { return },
  onSubmitEditing = () => { return },
  returnKeyType = "default",
  placeholder = 'Поиск...',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [text, setText] = useState(value);


  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderRadius: 12,
      paddingHorizontal: 15,
      height: 45,
      width: 300,
      borderWidth: 2,
      borderColor: isFocused ? "#1ED760" : "#bbb",
    }}>
      <Ionicons name="search" size={20} color={isFocused ? "#1ED760" : "#bbb"} style={{
        marginRight: 10,
      }} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={text}
        onChangeText={(t) => { onChangeText(t); setText(t) }}
        placeholderTextColor="#bbb"
        onFocus={() => setIsFocused(true)}  // пользователь зафокусился
        onBlur={() => setIsFocused(false)}  // пользователь ушел с поля
        onSubmitEditing={() => { setText(text.trimEnd()); onSubmitEditing(text.trimEnd()); }}
        returnKeyType={returnKeyType}
        underlineColorAndroid="transparent"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 45,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    outlineWidth: 0, // убираем стандартное выделение
    outlineColor: 'transparent', // безопасно
    width: '100%',
  },
});

export default SearchInput;

