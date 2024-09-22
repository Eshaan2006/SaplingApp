import React, { useState } from 'react';
import { View, StyleSheet, Button, Text } from 'react-native';
import { Calendar } from 'react-native-calendars';

const DatePicker = ({ selectedDates, setSelectedDates }) => {
  const onDayPress = (day) => {
    const newSelectedDates = { ...selectedDates };
    if (newSelectedDates[day.dateString]) {
      delete newSelectedDates[day.dateString];
    } else {
      newSelectedDates[day.dateString] = { selected: true, marked: true, selectedColor: '#2E6F40' };
    }
    setSelectedDates(newSelectedDates);
  };

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');  // Months are zero-based
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;  // Format as YYYY-MM-DD
  });

  return (
    <View>
      <Calendar
        onDayPress={onDayPress}
        markedDates={selectedDates}
        markingType={'multi-dot'}
        minDate={selectedDate}
        enableSwipeMonths={true}
        theme={{
          calendarBackground: '#C4A484',  // Background color of the calendar
          dayTextColor: '#000000',           // Color of the day labels
          textSectionTitleColor: '#2E6F40',  // Color of the month and day labels
          textDayFontWeight: 'bold',        // Font weight for the day labels
          monthTextColor: '#2E6F40',           // Color for the month text
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: 'bold',
          todayTextColor: '#2E6F40',         // Color of the today text
          arrowColor: '#2E6F40',            // Color of the arrow icon
        }}
      />
    </View>
  );
};


export default DatePicker;
