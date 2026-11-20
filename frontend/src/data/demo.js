// Returns a fresh set of fictional records for the demo and for resets.
      export function getDefaultState() {
        return {
          activeTab: 'dashboard',
          timeframe: 'Monthly',
          density: 'comfortable',
          animationsEnabled: true,
          selectedPatientId: 'pat-1',
          selectedMonthIndex: 1, // Feb highlighted by default matching screenshot
          activeNewsSlide: 0,
          pendingHighlight: 'all', // 'all' | 'report' | 'noreport'
          showProgressSeries: true,
          showRecoverySeries: true,
          trendMetricIndex: 0,
          filters: {
            doctor: 'all',
            status: 'all'
          },
          hiddenWidgets: [],
          notifications: [
            {
              id: 'n1',
              title: 'Lab Panel Ready: Cameron Williamson',
              desc: 'Hematology & recovery index updated to 85%.',
              time: '4m ago',
              unread: true,
              targetTab: 'report'
            },
            {
              id: 'n2',
              title: 'Checkup Reminder: 22 Agustus, 2024',
              desc: 'Follow-up outpatient screening scheduled with Dr.Leslie Alexander.',
              time: '28m ago',
              unread: true,
              targetTab: 'appointment'
            },
            {
              id: 'n3',
              title: 'New Physician Bulletin Published',
              desc: 'Updated telemedicine & prescription refill protocol.',
              time: '2h ago',
              unread: false,
              targetTab: 'dashboard'
            }
          ],
          checkups: [
            { id: 'chk-1', date: '22 Agustus, 2024', label: 'Cardiopulmonary Follow-up', progress: 42 },
            { id: 'chk-2', date: '16 Agustus, 2024', label: 'Comprehensive Blood Panel', progress: 68 }
          ],
          doctors: [
            {
              id: 'doc-1',
              name: 'Dr.Leslie Alexander',
              hospital: 'VitalPulse Demo Clinic',
              specialty: 'Internal Medicine & Recovery',
              experience: '14 yrs',
              rating: '4.9',
              avatar: './avatars/leslie.jpg'
            },
            {
              id: 'doc-2',
              name: 'Dr.Savannah Nguyen',
              hospital: 'VitalPulse Demo Clinic',
              specialty: 'Cardiology & Diagnostics',
              experience: '11 yrs',
              rating: '4.9',
              avatar: './avatars/savannah.jpg'
            },
            {
              id: 'doc-3',
              name: 'Dr.Darlene Robertson',
              hospital: 'VitalPulse Demo Clinic',
              specialty: 'Neurology & Rehabilitation',
              experience: '16 yrs',
              rating: '4.8',
              avatar: './avatars/darlene.jpg'
            }
          ],
          patients: [
            {
              id: 'pat-1',
              name: 'Cameron Williamson',
              role: 'Pasien',
              medicalHistory: 'Medical inpatient care',
              medications: 'Herbal medicine',
              allergies: 'No allergies present',
              physician: 'Dr.Leslie Alexander',
              recoveryRate: 85,
              status: 'Recovery',
              avatar: './avatars/cameron.jpg'
            },
            {
              id: 'pat-2',
              name: 'Eleanor Pena',
              role: 'Pasien',
              medicalHistory: 'Post-operative monitoring',
              medications: 'Beta-blocker 25mg',
              allergies: 'Penicillin (Mild)',
              physician: 'Dr.Savannah Nguyen',
              recoveryRate: 91,
              status: 'Active',
              avatar: './avatars/eleanor.jpg'
            },
            {
              id: 'pat-3',
              name: 'Marcus Vance',
              role: 'Pasien',
              medicalHistory: 'Neuro-rehabilitation',
              medications: 'Vitamin B-Complex',
              allergies: 'No allergies present',
              physician: 'Dr.Darlene Robertson',
              recoveryRate: 76,
              status: 'Pending',
              avatar: './avatars/marcus.jpg'
            },
            {
              id: 'pat-4',
              name: 'Nadia Kusuma',
              role: 'Pasien',
              medicalHistory: 'Outpatient respiratory care',
              medications: 'Inhaled corticosteroid',
              allergies: 'Dust mites',
              physician: 'Dr.Leslie Alexander',
              recoveryRate: 88,
              status: 'Recovery',
              avatar: './avatars/nadia.jpg'
            }
          ],
          appointments: [
            {
              id: 'apt-101',
              patientName: 'Cameron Williamson',
              doctorName: 'Dr.Leslie Alexander',
              department: 'Internal Medicine',
              dateTime: '22 Aug 2024 • 09:30 AM',
              status: 'Confirmed'
            },
            {
              id: 'apt-102',
              patientName: 'Eleanor Pena',
              doctorName: 'Dr.Savannah Nguyen',
              department: 'Cardiology Clinic',
              dateTime: '23 Aug 2024 • 11:00 AM',
              status: 'In Progress'
            },
            {
              id: 'apt-103',
              patientName: 'Marcus Vance',
              doctorName: 'Dr.Darlene Robertson',
              department: 'Neurology Rehab',
              dateTime: '24 Aug 2024 • 02:15 PM',
              status: 'Completed'
            }
          ],
          reports: [
            {
              id: 'RPT-4091',
              patientName: 'Cameron Williamson',
              panel: 'Complete Metabolic & Recovery Panel',
              score: 85,
              date: '16 Aug 2024',
              status: 'Completed'
            },
            {
              id: 'RPT-4092',
              patientName: 'Eleanor Pena',
              panel: 'Echocardiogram & Telemetry',
              score: 91,
              date: '18 Aug 2024',
              status: 'Completed'
            },
            {
              id: 'RPT-4093',
              patientName: 'Marcus Vance',
              panel: 'Neural Motor Function Assessment',
              score: 76,
              date: '20 Aug 2024',
              status: 'Pending'
            },
            {
              id: 'RPT-4094',
              patientName: 'Nadia Kusuma',
              panel: 'Pulmonary Spirometry Review',
              score: 88,
              date: '21 Aug 2024',
              status: 'Pending'
            }
          ]
        };
      }
