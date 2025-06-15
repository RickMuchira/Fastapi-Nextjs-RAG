'use client';

import { useState, useEffect } from 'react';
import { Course } from '@/types';

export default function CourseTree() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/course-tree')
      .then((res) => res.json())
      .then((data) => {
        setCourses(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching course tree:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      {courses.map((course) => (
        <div key={course.id} className="mb-4">
          <h2 className="text-xl font-semibold">{course.name}</h2>
          {course.years.map((year) => (
            <div key={year.id} className="ml-4">
              <h3 className="text-lg font-medium">{year.name}</h3>
              {year.semesters.map((semester) => (
                <div key={semester.id} className="ml-4">
                  <h4 className="text-md font-medium">{semester.name}</h4>
                  <ul className="ml-4">
                    {semester.units.map((unit) => (
                      <li key={unit.id}>
                        <a
                          href={`/quiz/${unit.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {unit.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}