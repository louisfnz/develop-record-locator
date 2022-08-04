import React, { useEffect, useState } from 'react';
import { determineLocation, getRecord } from './helpers';

const Location = ({ fields, record }) => {
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<string | undefined>();

  useEffect(() => {
    const Model =
      record.typename === 'Feature'
        ? aha.models.Feature
        : aha.models.Requirement;

    getRecord(Model, record.id).then(record => {
      determineLocation(record).then(recordLocation => {
        setLocation(recordLocation);
        setLoading(false);
      });
    });
  }, [record]);

  if (loading) return <aha-spinner />

  if (!location) return null;

  return (
    <>
      <div className='text-class'>{location}</div>
    </>
  );
};

export default Location;
