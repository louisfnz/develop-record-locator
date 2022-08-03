import React from 'react';
import Location from '../components/Location';

aha.on(
  'teamLocation',
  ({ record, fields, onUnmounted }, { identifier, settings }) => {
    return <Location record={record} fields={fields} />;
  }
);
