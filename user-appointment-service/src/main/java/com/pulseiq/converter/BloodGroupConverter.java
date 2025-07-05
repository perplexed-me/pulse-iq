package com.pulseiq.converter;

import com.pulseiq.entity.Patient.BloodGroup;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class BloodGroupConverter implements AttributeConverter<BloodGroup, String> {

    @Override
    public String convertToDatabaseColumn(BloodGroup bloodGroup) {
        if (bloodGroup == null) {
            return null;
        }
        return bloodGroup.getValue();
    }

    @Override
    public BloodGroup convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return null;
        }

        for (BloodGroup bg : BloodGroup.values()) {
            if (bg.getValue().equals(dbData)) {
                return bg;
            }
        }
        throw new IllegalArgumentException("Unknown blood group: " + dbData);
    }
}