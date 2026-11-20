import '@fontsource-variable/plus-jakarta-sans';
import './styles/dashboard.css';
import { getDefaultState } from './data/demo.js';
    (function () {

      var STORAGE_KEY = 'vitalpulse_dashboard_state_v2';
      var DEFAULT_AVATAR = './avatars/default.svg';

      var state = loadState();
      var selectedPatientIds = [];
      var patientPage = 1;
      var PATIENTS_PER_PAGE = 5;

      function loadState() {
        try {
          var raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) return getDefaultState();
          var parsed = JSON.parse(raw);
          var def = getDefaultState();
          return Object.assign({}, def, parsed, {
            filters: Object.assign({}, def.filters, parsed.filters || {})
          });
        } catch (err) {
          return getDefaultState();
        }
      }

      function saveState() {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (err) {
          // Ignore storage quota errors safely
        }
      }

      function showToast(message, type) {
        var container = document.getElementById('toastContainer');
        if (!container) return;
        var el = document.createElement('div');
        var isWarn = type === 'warn';
        el.className = 'pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold animate-enter ' +
          (isWarn ? 'bg-amber-900 text-amber-50 border-amber-700' : 'bg-[#1E293B] text-white border-slate-700');
        el.innerHTML =
          '<span class="w-2 h-2 rounded-full ' + (isWarn ? 'bg-amber-400' : 'bg-[#2DD4BF]') + '"></span>' +
          '<span>' + escapeHtml(message) + '</span>';
        container.appendChild(el);
        setTimeout(function () {
          el.style.opacity = '0';
          el.style.transform = 'translateY(6px)';
          el.style.transition = 'all 0.25s ease';
          setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
          }, 260);
        }, 2800);
      }

      function escapeHtml(str) {
        return String(str == null ? '' : str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      // =========================================================================
      // NAVIGATION & VIEW ROUTER
      // =========================================================================
      function switchTab(tabName) {
        state.activeTab = tabName;
        saveState();

        var views = document.querySelectorAll('.spa-view');
        for (var i = 0; i < views.length; i++) {
          views[i].classList.add('hidden');
        }
        var target = document.getElementById('view-' + tabName);
        if (target) target.classList.remove('hidden');

        var navTabs = document.querySelectorAll('.nav-tab');
        for (var j = 0; j < navTabs.length; j++) {
          var btn = navTabs[j];
          var isMatch = btn.getAttribute('data-nav') === tabName;
          if (isMatch) {
            btn.className = 'nav-tab nav-trigger px-5 py-2 rounded-full text-[13.5px] font-semibold transition-all bg-[#0D9488] text-white shadow-sm';
          } else {
            btn.className = 'nav-tab nav-trigger px-5 py-2 rounded-full text-[13.5px] font-medium text-slate-600 hover:text-brand-700 hover:bg-white/80 transition-all';
          }
        }

        document.getElementById('mobileNavDrawer').classList.add('hidden');

        if (tabName === 'patient') renderPatientsTable();
        if (tabName === 'appointment') renderAppointmentsTable();
        if (tabName === 'report') renderReportsTable();
      }

      // =========================================================================
      // DASHBOARD WIDGET RENDERERS
      // =========================================================================
      var NEWS_SLIDES = [
        {
          title: 'News From The Doctor',
          body: 'Our process is designed to make booking appointments, consultations, and treatments easy and convenient for you.',
          detail: 'Try the Patients and Appointment views to explore how the fictional clinic organizes its records.'
        },
        {
          title: 'Tele-Monitoring Protocol',
          body: 'The health trend and recovery charts show a sample timeline for comparison.',
          detail: 'Switch the reporting period or select a month to explore the sample values. This demo does not receive or monitor health data.'
        },
        {
          title: 'Preventive Screening Week',
          body: 'Explore two sample checkups and update their milestones from the dashboard.',
          detail: 'Use the "+ Check new" button to create a demo appointment. No consultation is actually scheduled.'
        },
        {
          title: 'Integrated Herbal & Clinical Care',
          body: 'The medical information card displays sample medication and history fields side by side.',
          detail: 'Entries are fictional. The demo does not review medications or check for interactions.'
        }
      ];

      var TREND_METRICS = [
        { label: 'Recovery', base: 85, delta: '+0,75%' },
        { label: 'Adherence', base: 92, delta: '+1,40%' },
        { label: 'Diagnostics', base: 79, delta: '+0,55%' }
      ];

      var RECOVERY_MONTHS = [
        { month: 'Jan', day: 'Friday', progress: 44, recovery: 42, featured: false, note1: 'baseline intake', note2: 'initial screening' },
        { month: 'Feb', day: 'Monday', progress: 56, recovery: 74, featured: true, note1: 'towards recovery', note2: 'treatment process' },
        { month: 'Mar', day: 'Wednesday', progress: 38, recovery: 36, featured: false, note1: 'therapy adjustment', note2: 'outpatient rest' },
        { month: 'Apr', day: 'Thursday', progress: 50, recovery: 49, featured: false, note1: 'steady progress', note2: 'medication sync' },
        { month: 'May', day: 'Tuesday', progress: 48, recovery: 47, featured: true, note1: 'active rehabilitation', note2: 'vitals stabilized' },
        { month: 'Jun', day: 'Saturday', progress: 60, recovery: 59, featured: false, note1: 'target milestone', note2: 'follow-up ready' }
      ];

      function renderNewsCarousel() {
        var slide = NEWS_SLIDES[state.activeNewsSlide] || NEWS_SLIDES[0];
        document.getElementById('newsSlideTitle').textContent = slide.title;
        document.getElementById('newsSlideBody').textContent = slide.body;

        var dots = document.querySelectorAll('.news-dot');
        for (var i = 0; i < dots.length; i++) {
          if (i === state.activeNewsSlide) {
            dots[i].className = 'news-dot h-1 rounded-full bg-white transition-all';
          } else {
            dots[i].className = 'news-dot h-1 rounded-full bg-white/35 hover:bg-white/60 transition-all';
          }
        }
      }

      function renderPendingChart() {
        var pendingReports = state.reports.filter(function (r) { return r.status === 'Pending'; }).length;
        var completedReports = state.reports.filter(function (r) { return r.status === 'Completed'; }).length;
        var mult = state.timeframe === 'Weekly' ? 1 : state.timeframe === 'Monthly' ? 7 : state.timeframe === 'Quarterly' ? 14 : 28;
        document.getElementById('pendingReportCount').textContent = pendingReports * mult + 1;
        document.getElementById('pendingNoReportCount').textContent = completedReports * 4 + 2;

        var reportPath = document.getElementById('reportCurvePath');
        var noReportPath = document.getElementById('noReportCurvePath');
        if (state.pendingHighlight === 'report') {
          reportPath.style.opacity = '1';
          reportPath.style.strokeWidth = '3';
          noReportPath.style.opacity = '0.25';
        } else if (state.pendingHighlight === 'noreport') {
          reportPath.style.opacity = '0.25';
          noReportPath.style.opacity = '1';
          noReportPath.style.strokeWidth = '3';
        } else {
          reportPath.style.opacity = '1';
          reportPath.style.strokeWidth = '2.4';
          noReportPath.style.opacity = '1';
          noReportPath.style.strokeWidth = '2.2';
        }
      }

      function renderTrendChart() {
        var metric = TREND_METRICS[state.trendMetricIndex % TREND_METRICS.length];
        var tfOffset = state.timeframe === 'Weekly' ? -2 : state.timeframe === 'Monthly' ? 0 : state.timeframe === 'Quarterly' ? 3 : 6;
        var avgPatientRecovery = 85;
        if (state.patients.length > 0) {
          var sum = 0;
          for (var i = 0; i < state.patients.length; i++) {
            sum += Number(state.patients[i].recoveryRate || 85);
          }
          avgPatientRecovery = Math.round(sum / state.patients.length);
        }
        var displayPct = state.trendMetricIndex === 0
          ? Math.min(99, Math.max(50, avgPatientRecovery + tfOffset))
          : Math.min(99, metric.base + tfOffset);

        document.getElementById('trendPercentValue').textContent = displayPct + '%';
        document.getElementById('trendDeltaBadge').textContent = metric.delta;
        document.getElementById('trendMetricSubtitle').textContent = metric.label;
      }

      function renderCheckupProgress() {
        var container = document.getElementById('checkupListContainer');
        if (!container) return;
        var html = '';
        for (var i = 0; i < state.checkups.length; i++) {
          var item = state.checkups[i];
          html +=
            '<button type="button" data-checkup-id="' + escapeHtml(item.id) + '" class="checkup-item-btn w-full text-left flex items-center gap-3.5 group focus:outline-none">' +
              '<div class="w-11 h-11 rounded-full bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center shrink-0 group-hover:bg-brand-600 group-hover:text-white transition">' +
                '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">' +
                  '<rect x="3" y="4" width="18" height="18" rx="3" />' +
                  '<path stroke-linecap="round" d="M16 2v4M8 2v4M3 10h18M9 15h6" />' +
                '</svg>' +
              '</div>' +
              '<div class="flex-1 min-w-0">' +
                '<div class="flex items-center justify-between gap-2 mb-1.5">' +
                  '<span class="text-[13px] font-bold text-slate-800 group-hover:text-brand-700 transition truncate">' + escapeHtml(item.date) + '</span>' +
                  '<span class="text-[11px] font-semibold text-brand-600">' + item.progress + '%</span>' +
                '</div>' +
                '<div class="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">' +
                  '<div class="h-full rounded-full bg-gradient-to-r from-[#0D9488] to-[#2DD4BF] transition-all duration-500" style="width:' + item.progress + '%"></div>' +
                '</div>' +
              '</div>' +
            '</button>';
        }
        container.innerHTML = html;
      }

      function renderFeaturedPatient() {
        var patient = state.patients.find(function (p) { return p.id === state.selectedPatientId; }) || state.patients[0];
        if (!patient) return;
        state.selectedPatientId = patient.id;

        var avatarEl = document.getElementById('featuredPatientAvatar');
        avatarEl.src = patient.avatar;
        avatarEl.alt = patient.name;

        document.getElementById('featuredPatientName').textContent = patient.name;
        document.getElementById('featuredPatientRole').textContent = patient.role || 'Pasien';
        document.getElementById('featuredMedHistory').textContent = patient.medicalHistory;
        document.getElementById('featuredMedications').textContent = patient.medications;
        document.getElementById('featuredAllergies').textContent = patient.allergies;
        document.getElementById('featuredPhysician').textContent = patient.physician;
      }

      function renderRecoveryBarChart() {
        var grid = document.getElementById('recoveryBarsGrid');
        if (!grid) return;

        var tfBoost = state.timeframe === 'Weekly' ? -4 : state.timeframe === 'Monthly' ? 0 : state.timeframe === 'Quarterly' ? 5 : 8;
        var html = '';

        for (var i = 0; i < RECOVERY_MONTHS.length; i++) {
          var m = RECOVERY_MONTHS[i];
          var val = Math.min(95, Math.max(20, (state.showRecoverySeries ? m.recovery : m.progress) + tfBoost));
          var isSelected = i === state.selectedMonthIndex;
          var isFeatured = m.featured || isSelected;

          var barStyle = isFeatured
            ? 'background: linear-gradient(180deg, #0D9488 0%, #5EEAD4 100%); box-shadow: 0 8px 18px -4px rgba(13,148,136,0.35);'
            : 'background: linear-gradient(180deg, #F0FDFA 0%, #CCFBF1 100%); border: 1px solid #99F6E4;';

          if (!state.showRecoverySeries && !state.showProgressSeries) {
            barStyle = 'background: #F1F5F9;';
          }

          html +=
            '<button type="button" data-bar-idx="' + i + '" class="recovery-bar-btn h-full flex flex-col items-center justify-end gap-2 group focus:outline-none">' +
              '<div class="w-full max-w-[46px] rounded-xl transition-all duration-300 group-hover:scale-[1.03] ' + (isSelected ? 'ring-2 ring-brand-600 ring-offset-2' : '') + '" style="height:' + val + '%; ' + barStyle + '"></div>' +
              '<span class="text-[11px] ' + (isSelected ? 'font-bold text-brand-700' : 'font-medium text-slate-400') + '">' + m.month + '</span>' +
            '</button>';
        }
        grid.innerHTML = html;

        // Update floating dark callout card
        var activeMonth = RECOVERY_MONTHS[state.selectedMonthIndex] || RECOVERY_MONTHS[1];
        var activeVal = Math.min(95, Math.max(20, activeMonth.recovery + tfBoost));
        document.getElementById('calloutTitle').textContent = activeMonth.day + ' • ' + activeMonth.month + ' (' + activeVal + '%)';
        document.getElementById('calloutLine1').textContent = activeMonth.note1;
        document.getElementById('calloutLine2').textContent = activeMonth.note2;
      }

      function renderMyDoctors() {
        var container = document.getElementById('myDoctorListContainer');
        if (!container) return;

        var filtered = state.doctors.filter(function (doc) {
          if (state.filters.doctor !== 'all' && doc.name !== state.filters.doctor) return false;
          return true;
        });
        var list = filtered.length > 0 ? filtered : state.doctors;

        var html = '';
        for (var i = 0; i < list.length; i++) {
          var d = list[i];
          html +=
            '<button type="button" data-doc-id="' + escapeHtml(d.id) + '" class="doctor-row-btn w-full text-left flex items-center gap-3 p-2 rounded-2xl hover:bg-brand-50/70 transition group">' +
              '<img data-avatar src="' + escapeHtml(d.avatar) + '" alt="" class="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-brand-400 shrink-0" />' +
              '<div class="min-w-0 flex-1">' +
                '<p class="text-[13px] font-bold text-slate-800 truncate group-hover:text-brand-700 transition">' + escapeHtml(d.name) + '</p>' +
                '<p class="text-[11px] text-slate-400 truncate">' + escapeHtml(d.hospital) + '</p>' +
              '</div>' +
            '</button>';
        }
        container.innerHTML = html;
      }

      function renderAllDashboard() {
        renderPendingChart();
        renderNewsCarousel();
        renderTrendChart();
        renderCheckupProgress();
        renderFeaturedPatient();
        renderRecoveryBarChart();
        renderMyDoctors();
        renderNotifications();
        populateFilterPatientDropdown();
        applyWidgetVisibilityAndDensity();
      }

      // =========================================================================
      // NOTIFICATIONS & FILTER DROPDOWN HELPERS
      // =========================================================================
      function renderNotifications() {
        var listEl = document.getElementById('notifList');
        var dotEl = document.getElementById('notifBadgeDot');
        if (!listEl) return;

        var hasUnread = state.notifications.some(function (n) { return n.unread; });
        if (dotEl) {
          dotEl.classList.toggle('hidden', !hasUnread);
        }

        var html = '';
        for (var i = 0; i < state.notifications.length; i++) {
          var n = state.notifications[i];
          html +=
            '<button type="button" data-notif-id="' + escapeHtml(n.id) + '" class="notif-item-btn w-full text-left py-2.5 px-2 hover:bg-slate-50 rounded-xl transition flex items-start gap-2.5">' +
              '<span class="w-2 h-2 rounded-full mt-1.5 shrink-0 ' + (n.unread ? 'bg-brand-600' : 'bg-slate-200') + '"></span>' +
              '<div class="min-w-0 flex-1">' +
                '<p class="text-xs font-bold text-slate-800 truncate">' + escapeHtml(n.title) + '</p>' +
                '<p class="text-[11px] text-slate-500 leading-snug mt-0.5">' + escapeHtml(n.desc) + '</p>' +
                '<span class="text-[10px] text-slate-400 mt-1 block">' + escapeHtml(n.time) + '</span>' +
              '</div>' +
            '</button>';
        }
        listEl.innerHTML = html;
      }

      function populateFilterPatientDropdown() {
        var sel = document.getElementById('filterPatientSelect');
        if (!sel) return;
        var html = '';
        for (var i = 0; i < state.patients.length; i++) {
          var p = state.patients[i];
          html += '<option value="' + escapeHtml(p.id) + '"' + (p.id === state.selectedPatientId ? ' selected' : '') + '>' + escapeHtml(p.name) + '</option>';
        }
        sel.innerHTML = html;
      }

      function applyWidgetVisibilityAndDensity() {
        var shell = document.getElementById('appShell');
        if (shell) {
          shell.classList.toggle('density-compact', state.density === 'compact');
        }
        document.body.classList.toggle('no-anim', !state.animationsEnabled);

        var allWidgetIds = ['widget-pending', 'widget-news', 'widget-trend', 'widget-checkup', 'widget-medinfo', 'widget-healthreport', 'widget-mydoctor'];
        for (var i = 0; i < allWidgetIds.length; i++) {
          var wId = allWidgetIds[i];
          var el = document.getElementById(wId);
          var isHidden = state.hiddenWidgets.indexOf(wId) !== -1;
          if (el) el.classList.toggle('hidden', isHidden);
        }

        var toggles = document.querySelectorAll('.widget-toggle');
        for (var j = 0; j < toggles.length; j++) {
          var wTarget = toggles[j].getAttribute('data-widget');
          toggles[j].checked = state.hiddenWidgets.indexOf(wTarget) === -1;
        }
      }

      // =========================================================================
      // MULTI-TAB CRUD TABLES (PATIENT, APPOINTMENT, REPORT)
      // =========================================================================
      function renderPatientsTable() {
        var tbody = document.getElementById('patientsTableBody');
        if (!tbody) return;

        var q = (document.getElementById('patientSearchInput').value || '').toLowerCase().trim();
        var statusFilter = document.getElementById('patientStatusFilter').value;
        var sortMode = document.getElementById('patientSortSelect').value;

        var list = state.patients.filter(function (p) {
          if (statusFilter !== 'all' && p.status !== statusFilter) return false;
          if (state.filters.doctor !== 'all' && p.physician !== state.filters.doctor) return false;
          if (q) {
            var hay = (p.name + ' ' + p.medicalHistory + ' ' + p.medications + ' ' + p.physician).toLowerCase();
            if (hay.indexOf(q) === -1) return false;
          }
          return true;
        });

        list.sort(function (a, b) {
          if (sortMode === 'name-desc') return b.name.localeCompare(a.name);
          if (sortMode === 'recovery-desc') return Number(b.recoveryRate) - Number(a.recoveryRate);
          return a.name.localeCompare(b.name);
        });

        var totalPages = Math.max(1, Math.ceil(list.length / PATIENTS_PER_PAGE));
        if (patientPage > totalPages) patientPage = totalPages;
        var startIdx = (patientPage - 1) * PATIENTS_PER_PAGE;
        var slice = list.slice(startIdx, startIdx + PATIENTS_PER_PAGE);

        var html = '';
        if (slice.length === 0) {
          html = '<tr><td colspan="8" class="py-8 text-center text-slate-400">No matching patient records found.</td></tr>';
        } else {
          for (var i = 0; i < slice.length; i++) {
            var p = slice[i];
            var checked = selectedPatientIds.indexOf(p.id) !== -1;
            var badgeClass = p.status === 'Recovery'
              ? 'bg-teal-50 text-teal-700 border-teal-200'
              : p.status === 'Active'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200';

            html +=
              '<tr class="hover:bg-slate-50/80 transition">' +
                '<td class="py-3 px-4"><input type="checkbox" data-pat-cb="' + escapeHtml(p.id) + '" class="pat-row-cb accent-teal-600 rounded"' + (checked ? ' checked' : '') + ' /></td>' +
                '<td class="py-3 px-4">' +
                  '<div class="flex items-center gap-2.5">' +
                    '<img data-avatar src="' + escapeHtml(p.avatar) + '" alt="" class="w-8 h-8 rounded-full object-cover" />' +
                    '<div>' +
                      '<p class="font-bold text-slate-800">' + escapeHtml(p.name) + '</p>' +
                      '<p class="text-[11px] text-slate-400">' + escapeHtml(p.allergies) + '</p>' +
                    '</div>' +
                  '</div>' +
                '</td>' +
                '<td class="py-3 px-4 text-slate-700 font-medium">' + escapeHtml(p.medicalHistory) + '</td>' +
                '<td class="py-3 px-4 text-slate-600">' + escapeHtml(p.medications) + '</td>' +
                '<td class="py-3 px-4 text-slate-700 font-medium">' + escapeHtml(p.physician) + '</td>' +
                '<td class="py-3 px-4 font-bold text-brand-700">' + escapeHtml(p.recoveryRate) + '%</td>' +
                '<td class="py-3 px-4"><span class="px-2.5 py-1 rounded-full text-[11px] font-semibold border ' + badgeClass + '">' + escapeHtml(p.status) + '</span></td>' +
                '<td class="py-3 px-4 text-right space-x-1.5">' +
                  '<button type="button" data-focus-pat="' + escapeHtml(p.id) + '" class="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 font-semibold">Pin</button>' +
                  '<button type="button" data-edit-pat="' + escapeHtml(p.id) + '" class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold">Edit</button>' +
                  '<button type="button" data-del-pat="' + escapeHtml(p.id) + '" class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold">Delete</button>' +
                '</td>' +
              '</tr>';
          }
        }
        tbody.innerHTML = html;

        // Pagination bar
        var pagBar = document.getElementById('patientsPaginationBar');
        if (pagBar) {
          pagBar.innerHTML =
            '<span>Showing ' + slice.length + ' of ' + list.length + ' patients</span>' +
            '<div class="flex items-center gap-1.5">' +
              '<button type="button" id="prevPatPageBtn" class="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"' + (patientPage <= 1 ? ' disabled' : '') + '>Prev</button>' +
              '<span class="px-2 font-semibold text-slate-700">Page ' + patientPage + ' / ' + totalPages + '</span>' +
              '<button type="button" id="nextPatPageBtn" class="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"' + (patientPage >= totalPages ? ' disabled' : '') + '>Next</button>' +
            '</div>';
        }

        updateBulkDeleteUi();
      }

      function updateBulkDeleteUi() {
        var btn = document.getElementById('bulkDeletePatientsBtn');
        var countSpan = document.getElementById('selectedPatientCount');
        if (!btn || !countSpan) return;
        countSpan.textContent = selectedPatientIds.length;
        btn.classList.toggle('hidden', selectedPatientIds.length === 0);
      }

      function renderAppointmentsTable() {
        var tbody = document.getElementById('appointmentsTableBody');
        if (!tbody) return;

        var q = (document.getElementById('appointmentSearchInput').value || '').toLowerCase().trim();
        var st = document.getElementById('appointmentStatusFilter').value;

        var list = state.appointments.filter(function (a) {
          if (st !== 'all' && a.status !== st) return false;
          if (q) {
            var hay = (a.patientName + ' ' + a.doctorName + ' ' + a.department).toLowerCase();
            if (hay.indexOf(q) === -1) return false;
          }
          return true;
        });

        var html = '';
        if (list.length === 0) {
          html = '<tr><td colspan="6" class="py-8 text-center text-slate-400">No appointments match the current filter.</td></tr>';
        } else {
          for (var i = 0; i < list.length; i++) {
            var a = list[i];
            var badge = a.status === 'Confirmed'
              ? 'bg-teal-50 text-teal-700 border-teal-200'
              : a.status === 'In Progress'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-slate-100 text-slate-700 border-slate-200';

            html +=
              '<tr class="hover:bg-slate-50/80 transition">' +
                '<td class="py-3 px-4 font-bold text-slate-800">' + escapeHtml(a.patientName) + '</td>' +
                '<td class="py-3 px-4 text-slate-700 font-medium">' + escapeHtml(a.doctorName) + '</td>' +
                '<td class="py-3 px-4 text-slate-600">' + escapeHtml(a.department) + '</td>' +
                '<td class="py-3 px-4 text-slate-600">' + escapeHtml(a.dateTime) + '</td>' +
                '<td class="py-3 px-4"><span class="px-2.5 py-1 rounded-full text-[11px] font-semibold border ' + badge + '">' + escapeHtml(a.status) + '</span></td>' +
                '<td class="py-3 px-4 text-right space-x-1.5">' +
                  '<button type="button" data-edit-apt="' + escapeHtml(a.id) + '" class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold">Edit</button>' +
                  '<button type="button" data-del-apt="' + escapeHtml(a.id) + '" class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold">Delete</button>' +
                '</td>' +
              '</tr>';
          }
        }
        tbody.innerHTML = html;
      }

      function renderReportsTable() {
        var tbody = document.getElementById('reportsTableBody');
        if (!tbody) return;

        var q = (document.getElementById('reportSearchInput').value || '').toLowerCase().trim();
        var st = document.getElementById('reportStatusFilter').value;

        var list = state.reports.filter(function (r) {
          if (st !== 'all' && r.status !== st) return false;
          if (q) {
            var hay = (r.id + ' ' + r.patientName + ' ' + r.panel).toLowerCase();
            if (hay.indexOf(q) === -1) return false;
          }
          return true;
        });

        var html = '';
        if (list.length === 0) {
          html = '<tr><td colspan="7" class="py-8 text-center text-slate-400">No diagnostic reports found.</td></tr>';
        } else {
          for (var i = 0; i < list.length; i++) {
            var r = list[i];
            var badge = r.status === 'Completed'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200';

            html +=
              '<tr class="hover:bg-slate-50/80 transition">' +
                '<td class="py-3 px-4 font-bold text-brand-700">' + escapeHtml(r.id) + '</td>' +
                '<td class="py-3 px-4 font-bold text-slate-800">' + escapeHtml(r.patientName) + '</td>' +
                '<td class="py-3 px-4 text-slate-600">' + escapeHtml(r.panel) + '</td>' +
                '<td class="py-3 px-4 font-bold text-slate-800">' + escapeHtml(r.score) + '%</td>' +
                '<td class="py-3 px-4 text-slate-500">' + escapeHtml(r.date) + '</td>' +
                '<td class="py-3 px-4"><span class="px-2.5 py-1 rounded-full text-[11px] font-semibold border ' + badge + '">' + escapeHtml(r.status) + '</span></td>' +
                '<td class="py-3 px-4 text-right space-x-1.5">' +
                  '<button type="button" data-edit-rpt="' + escapeHtml(r.id) + '" class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold">Edit</button>' +
                  '<button type="button" data-del-rpt="' + escapeHtml(r.id) + '" class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold">Delete</button>' +
                '</td>' +
              '</tr>';
          }
        }
        tbody.innerHTML = html;
      }

      // =========================================================================
      // MODAL BUILDERS (CRUD FORMS, QR PASS, DOCTOR DIRECTORY, SETTINGS)
      // =========================================================================
      function openModal(title, innerHtml) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = innerHtml;
        document.getElementById('universalModalBackdrop').classList.remove('hidden');
      }

      function closeModal() {
        document.getElementById('universalModalBackdrop').classList.add('hidden');
      }

      function openPatientFormModal(existingPatient) {
        var isEdit = Boolean(existingPatient);
        var p = existingPatient || {
          name: '',
          medicalHistory: 'Medical inpatient care',
          medications: 'Herbal medicine',
          allergies: 'No allergies present',
          physician: 'Dr.Leslie Alexander',
          recoveryRate: 85,
          status: 'Active'
        };

        var html =
          '<form id="patientCrudForm" class="space-y-3.5 text-xs">' +
            '<input type="hidden" name="id" value="' + escapeHtml(p.id || '') + '" />' +
            '<div>' +
              '<label class="block font-semibold text-slate-700 mb-1">Full Patient Name *</label>' +
              '<input type="text" name="name" required value="' + escapeHtml(p.name) + '" placeholder="e.g., Cameron Williamson" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-brand-500 focus:outline-none" />' +
            '</div>' +
            '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' +
              '<div>' +
                '<label class="block font-semibold text-slate-700 mb-1">Medical History *</label>' +
                '<input type="text" name="medicalHistory" required value="' + escapeHtml(p.medicalHistory) + '" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-brand-500 focus:outline-none" />' +
              '</div>' +
              '<div>' +
                '<label class="block font-semibold text-slate-700 mb-1">Current Medications</label>' +
                '<input type="text" name="medications" value="' + escapeHtml(p.medications) + '" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-brand-500 focus:outline-none" />' +
              '</div>' +
            '</div>' +
            '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' +
              '<div>' +
                '<label class="block font-semibold text-slate-700 mb-1">Allergies</label>' +
                '<input type="text" name="allergies" value="' + escapeHtml(p.allergies) + '" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-brand-500 focus:outline-none" />' +
              '</div>' +
              '<div>' +
                '<label class="block font-semibold text-slate-700 mb-1">Primary Physician</label>' +
                '<select name="physician" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-brand-500 focus:outline-none">' +
                  '<option value="Dr.Leslie Alexander"' + (p.physician === 'Dr.Leslie Alexander' ? ' selected' : '') + '>Dr.Leslie Alexander</option>' +
                  '<option value="Dr.Savannah Nguyen"' + (p.physician === 'Dr.Savannah Nguyen' ? ' selected' : '') + '>Dr.Savannah Nguyen</option>' +
                  '<option value="Dr.Darlene Robertson"' + (p.physician === 'Dr.Darlene Robertson' ? ' selected' : '') + '>Dr.Darlene Robertson</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' +
              '<div>' +
                '<label class="block font-semibold text-slate-700 mb-1">Recovery Score (%)</label>' +
                '<input type="number" name="recoveryRate" min="1" max="100" value="' + escapeHtml(p.recoveryRate) + '" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-brand-500 focus:outline-none" />' +
              '</div>' +
              '<div>' +
                '<label class="block font-semibold text-slate-700 mb-1">Clinical Status</label>' +
                '<select name="status" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-brand-500 focus:outline-none">' +
                  '<option value="Active"' + (p.status === 'Active' ? ' selected' : '') + '>Active</option>' +
                  '<option value="Recovery"' + (p.status === 'Recovery' ? ' selected' : '') + '>Recovery</option>' +
                  '<option value="Pending"' + (p.status === 'Pending' ? ' selected' : '') + '>Pending</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div>' +
              '<label for="patientAvatarUrl" class="block font-semibold text-slate-700 mb-1">Portrait URL (optional)</label>' +
              '<input id="patientAvatarUrl" type="url" name="avatar" value="' + escapeHtml(p.avatar?.startsWith('./avatars/') ? '' : p.avatar || '') + '" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-brand-500 focus:outline-none" />' +
            '</div>' +
            '<div class="pt-3 flex justify-end gap-2">' +
              '<button type="button" onclick="document.getElementById(\'closeUniversalModalBtn\').click()" class="px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-semibold">Cancel</button>' +
              '<button type="submit" class="px-5 py-2 rounded-full bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold shadow-sm">' + (isEdit ? 'Save Changes' : 'Register Patient') + '</button>' +
            '</div>' +
          '</form>';

        openModal(isEdit ? 'Edit Patient Record' : 'Register New Patient', html);
      }

      function openAppointmentFormModal(existingApt, preselectedDoctor) {
        var isEdit = Boolean(existingApt);
        var a = existingApt || {
          patientName: state.patients[0] ? state.patients[0].name : 'Cameron Williamson',
          doctorName: preselectedDoctor || 'Dr.Leslie Alexander',
          department: 'Internal Medicine',
          dateTime: '26 Aug 2024 • 10:00 AM',
          status: 'Confirmed'
        };

        var patientOptions = '';
        for (var i = 0; i < state.patients.length; i++) {
          var pn = state.patients[i].name;
          patientOptions += '<option value="' + escapeHtml(pn) + '"' + (a.patientName === pn ? ' selected' : '') + '>' + escapeHtml(pn) + '</option>';
        }

        var html =
          '<form id="appointmentCrudForm" class="space-y-3.5 text-xs">' +
            '<input type="hidden" name="id" value="' + escapeHtml(a.id || '') + '" />' +
            '<div>' +
              '<label class="block font-semibold text-slate-700 mb-1">Patient *</label>' +
              '<select name="patientName" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-brand-500 focus:outline-none">' + patientOptions + '</select>' +
            '</div>' +
            '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' +
              '<div>' +
                '<label class="block font-semibold text-slate-700 mb-1">Specialist *</label>' +
                '<select name="doctorName" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-brand-500 focus:outline-none">' +
                  '<option value="Dr.Leslie Alexander"' + (a.doctorName === 'Dr.Leslie Alexander' ? ' selected' : '') + '>Dr.Leslie Alexander</option>' +
                  '<option value="Dr.Savannah Nguyen"' + (a.doctorName === 'Dr.Savannah Nguyen' ? ' selected' : '') + '>Dr.Savannah Nguyen</option>' +
                  '<option value="Dr.Darlene Robertson"' + (a.doctorName === 'Dr.Darlene Robertson' ? ' selected' : '') + '>Dr.Darlene Robertson</option>' +
                '</select>' +
              '</div>' +
              '<div>' +
                '<label class="block font-semibold text-slate-700 mb-1">Department</label>' +
                '<input type="text" name="department" required value="' + escapeHtml(a.department) + '" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-brand-500 focus:outline-none" />' +
              '</div>' +
            '</div>' +
            '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' +
              '<div>' +
                '<label class="block font-semibold text-slate-700 mb-1">Date &amp; Time *</label>' +
                '<input type="text" name="dateTime" required value="' + escapeHtml(a.dateTime) + '" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-brand-500 focus:outline-none" />' +
              '</div>' +
              '<div>' +
                '<label class="block font-semibold text-slate-700 mb-1">Status</label>' +
                '<select name="status" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-brand-500 focus:outline-none">' +
                  '<option value="Confirmed"' + (a.status === 'Confirmed' ? ' selected' : '') + '>Confirmed</option>' +
                  '<option value="In Progress"' + (a.status === 'In Progress' ? ' selected' : '') + '>In Progress</option>' +
                  '<option value="Completed"' + (a.status === 'Completed' ? ' selected' : '') + '>Completed</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div class="pt-3 flex justify-end gap-2">' +
              '<button type="button" onclick="document.getElementById(\'closeUniversalModalBtn\').click()" class="px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-semibold">Cancel</button>' +
              '<button type="submit" class="px-5 py-2 rounded-full bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold shadow-sm">' + (isEdit ? 'Update Appointment' : 'Confirm Booking') + '</button>' +
            '</div>' +
          '</form>';

        openModal(isEdit ? 'Edit Appointment' : 'Book Clinical Consultation', html);
      }

      function openReportFormModal(existingRpt) {
        var isEdit = Boolean(existingRpt);
        var r = existingRpt || {
          patientName: state.patients[0] ? state.patients[0].name : 'Cameron Williamson',
          panel: 'Comprehensive Wellness & Blood Panel',
          score: 86,
          date: '24 Aug 2024',
          status: 'Pending'
        };

        var patientOptions = '';
        for (var i = 0; i < state.patients.length; i++) {
          var pn = state.patients[i].name;
          patientOptions += '<option value="' + escapeHtml(pn) + '"' + (r.patientName === pn ? ' selected' : '') + '>' + escapeHtml(pn) + '</option>';
        }

        var html =
          '<form id="reportCrudForm" class="space-y-3.5 text-xs">' +
            '<input type="hidden" name="id" value="' + escapeHtml(r.id || '') + '" />' +
            '<div>' +
              '<label class="block font-semibold text-slate-700 mb-1">Patient *</label>' +
              '<select name="patientName" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-brand-500 focus:outline-none">' + patientOptions + '</select>' +
            '</div>' +
            '<div>' +
              '<label class="block font-semibold text-slate-700 mb-1">Diagnostic Panel Title *</label>' +
              '<input type="text" name="panel" required value="' + escapeHtml(r.panel) + '" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-brand-500 focus:outline-none" />' +
            '</div>' +
            '<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">' +
              '<div>' +
                '<label class="block font-semibold text-slate-700 mb-1">Recovery Score (%)</label>' +
                '<input type="number" name="score" min="1" max="100" value="' + escapeHtml(r.score) + '" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-brand-500 focus:outline-none" />' +
              '</div>' +
              '<div>' +
                '<label class="block font-semibold text-slate-700 mb-1">Date</label>' +
                '<input type="text" name="date" value="' + escapeHtml(r.date) + '" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-brand-500 focus:outline-none" />' +
              '</div>' +
              '<div>' +
                '<label class="block font-semibold text-slate-700 mb-1">Status</label>' +
                '<select name="status" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-brand-500 focus:outline-none">' +
                  '<option value="Pending"' + (r.status === 'Pending' ? ' selected' : '') + '>Pending</option>' +
                  '<option value="Completed"' + (r.status === 'Completed' ? ' selected' : '') + '>Completed</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div class="pt-3 flex justify-end gap-2">' +
              '<button type="button" onclick="document.getElementById(\'closeUniversalModalBtn\').click()" class="px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-semibold">Cancel</button>' +
              '<button type="submit" class="px-5 py-2 rounded-full bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold shadow-sm">' + (isEdit ? 'Save Report' : 'Publish Report') + '</button>' +
            '</div>' +
          '</form>';

        openModal(isEdit ? 'Edit Diagnostic Report' : 'Create Diagnostic Report', html);
      }

      // =========================================================================
      // CSV EXPORT & SUPPORT FAQ RENDERING
      // =========================================================================
      function exportCurrentCsv() {
        var rows = [['Patient Name', 'Role', 'Medical History', 'Medications', 'Allergies', 'Primary Physician', 'Recovery Rate (%)', 'Status']];
        for (var i = 0; i < state.patients.length; i++) {
          var p = state.patients[i];
          rows.push([p.name, p.role, p.medicalHistory, p.medications, p.allergies, p.physician, p.recoveryRate, p.status]);
        }
        var csv = rows.map(function (r) {
          return r.map(function (cell) {
            return '"' + String(cell).replace(/"/g, '""') + '"';
          }).join(',');
        }).join('\n');

        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'VitalPulse_Clinical_Data_' + state.timeframe + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Exported VitalPulse ' + state.timeframe + ' CSV dataset');
      }

      var SUPPORT_FAQS = [
        { q: 'How do I switch the active patient in Medical Information?', a: 'Click directly on the patient avatar/name inside the Medical Information card or use the Filter popover to pin any patient.' },
        { q: 'How are Recovery percentages calculated?', a: 'Recovery scores combine inpatient care milestones, lab diagnostic panels, and checkup progress across your selected timeframe.' },
        { q: 'Can I reset demo records after testing CRUD?', a: 'Yes! Click the Settings gear icon in the top-right header and select "Reset Demo Data" to restore default records.' }
      ];

      function renderSupportFaqs(filterText) {
        var container = document.getElementById('supportFaqList');
        if (!container) return;
        var q = (filterText || '').toLowerCase().trim();
        var html = '';
        for (var i = 0; i < SUPPORT_FAQS.length; i++) {
          var item = SUPPORT_FAQS[i];
          if (q && item.q.toLowerCase().indexOf(q) === -1 && item.a.toLowerCase().indexOf(q) === -1) continue;
          html +=
            '<div class="p-3 rounded-xl bg-slate-50 border border-slate-100">' +
              '<p class="text-xs font-bold text-slate-800">' + escapeHtml(item.q) + '</p>' +
              '<p class="text-[11px] text-slate-600 mt-1 leading-relaxed">' + escapeHtml(item.a) + '</p>' +
            '</div>';
        }
        container.innerHTML = html || '<p class="text-xs text-slate-400">No matching guides found.</p>';
      }

      // =========================================================================
      // EVENT LISTENERS & DELEGATION
      // =========================================================================
      function bindEvents() {
        // Navigation tabs
        document.addEventListener('click', function (e) {
          var navEl = e.target.closest('.nav-trigger');
          if (navEl) {
            e.preventDefault();
            var target = navEl.getAttribute('data-nav');
            if (target) switchTab(target);
          }
        });

        // Mobile drawer toggle
        document.getElementById('mobileMenuBtn').addEventListener('click', function () {
          document.getElementById('mobileNavDrawer').classList.toggle('hidden');
        });

        // "+ Check new" quick action modal
        document.getElementById('checkNewBtn').addEventListener('click', function () {
          openModal('Quick Clinical Check-In',
            '<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">' +
              '<button type="button" id="quickAddPatBtn" class="p-4 rounded-2xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 text-left transition">' +
                '<span class="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center mb-2">+</span>' +
                '<p class="font-bold text-slate-800">New Patient</p>' +
                '<p class="text-[11px] text-slate-500 mt-0.5">Register inpatient or outpatient profile</p>' +
              '</button>' +
              '<button type="button" id="quickAddAptBtn" class="p-4 rounded-2xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 text-left transition">' +
                '<span class="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center mb-2">+</span>' +
                '<p class="font-bold text-slate-800">Appointment</p>' +
                '<p class="text-[11px] text-slate-500 mt-0.5">Book specialist consultation slot</p>' +
              '</button>' +
              '<button type="button" id="quickAddRptBtn" class="p-4 rounded-2xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 text-left transition">' +
                '<span class="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center mb-2">+</span>' +
                '<p class="font-bold text-slate-800">Health Report</p>' +
                '<p class="text-[11px] text-slate-500 mt-0.5">Log lab &amp; recovery diagnostic</p>' +
              '</button>' +
            '</div>'
          );
          document.getElementById('quickAddPatBtn').addEventListener('click', function () { openPatientFormModal(null); });
          document.getElementById('quickAddAptBtn').addEventListener('click', function () { openAppointmentFormModal(null); });
          document.getElementById('quickAddRptBtn').addEventListener('click', function () { openReportFormModal(null); });
        });

        // Popover toggles (Filter, Timeframe, Layout, Notifications)
        function closeAllPopovers(exceptId) {
          var ids = ['filterPopover', 'timeframeDropdown', 'layoutPopover', 'notifPopover'];
          for (var i = 0; i < ids.length; i++) {
            if (ids[i] !== exceptId) {
              var el = document.getElementById(ids[i]);
              if (el) el.classList.add('hidden');
            }
          }
        }

        document.getElementById('filterToggleBtn').addEventListener('click', function (e) {
          e.stopPropagation();
          closeAllPopovers('filterPopover');
          document.getElementById('filterPopover').classList.toggle('hidden');
        });

        document.getElementById('timeframeBtn').addEventListener('click', function (e) {
          e.stopPropagation();
          closeAllPopovers('timeframeDropdown');
          document.getElementById('timeframeDropdown').classList.toggle('hidden');
        });

        document.getElementById('layoutBtn').addEventListener('click', function (e) {
          e.stopPropagation();
          closeAllPopovers('layoutPopover');
          document.getElementById('layoutPopover').classList.toggle('hidden');
        });

        document.getElementById('notifBtn').addEventListener('click', function (e) {
          e.stopPropagation();
          closeAllPopovers('notifPopover');
          document.getElementById('notifPopover').classList.toggle('hidden');
        });

        document.addEventListener('click', function (e) {
          if (!e.target.closest('#filterPopover') && !e.target.closest('#filterToggleBtn') &&
              !e.target.closest('#timeframeDropdown') && !e.target.closest('#timeframeBtn') &&
              !e.target.closest('#layoutPopover') && !e.target.closest('#layoutBtn') &&
              !e.target.closest('#notifPopover') && !e.target.closest('#notifBtn')) {
            closeAllPopovers(null);
          }
        });

        // Apply & Reset Clinical Filters
        document.getElementById('applyFilterBtn').addEventListener('click', function () {
          state.filters.doctor = document.getElementById('filterDoctorSelect').value;
          state.filters.status = document.getElementById('filterStatusSelect').value;
          state.selectedPatientId = document.getElementById('filterPatientSelect').value;
          saveState();
          renderAllDashboard();

          var activeCount = (state.filters.doctor !== 'all' ? 1 : 0) + (state.filters.status !== 'all' ? 1 : 0);
          var badge = document.getElementById('activeFilterCount');
          badge.textContent = activeCount;
          badge.classList.toggle('hidden', activeCount === 0);

          document.getElementById('filterPopover').classList.add('hidden');
          showToast('Clinical filters applied');
        });

        document.getElementById('resetFiltersBtn').addEventListener('click', function () {
          state.filters.doctor = 'all';
          state.filters.status = 'all';
          document.getElementById('filterDoctorSelect').value = 'all';
          document.getElementById('filterStatusSelect').value = 'all';
          document.getElementById('activeFilterCount').classList.add('hidden');
          saveState();
          renderAllDashboard();
          showToast('Filters reset');
        });

        // Timeframe dropdown options
        var tfOptions = document.querySelectorAll('.tf-option');
        for (var i = 0; i < tfOptions.length; i++) {
          tfOptions[i].addEventListener('click', function () {
            var tf = this.getAttribute('data-tf');
            state.timeframe = tf;
            document.getElementById('timeframeLabel').textContent = tf;
            saveState();
            renderAllDashboard();
            document.getElementById('timeframeDropdown').classList.add('hidden');
            showToast('Reporting timeframe set to ' + tf);
          });
        }

        // Download CSV button
        document.getElementById('downloadCsvBtn').addEventListener('click', exportCurrentCsv);

        // Expandable Global Search
        var searchInput = document.getElementById('globalSearchInput');
        var clearSearchBtn = document.getElementById('clearGlobalSearchBtn');
        document.getElementById('globalSearchBtn').addEventListener('click', function () {
          var isClosed = searchInput.classList.contains('w-0');
          if (isClosed) {
            searchInput.classList.remove('w-0', 'opacity-0');
            searchInput.classList.add('w-44', 'sm:w-56', 'px-2', 'opacity-100');
            searchInput.focus();
          } else if (!searchInput.value) {
            searchInput.classList.add('w-0', 'opacity-0');
            searchInput.classList.remove('w-44', 'sm:w-56', 'px-2', 'opacity-100');
          }
        });

        searchInput.addEventListener('input', function () {
          var val = this.value.trim().toLowerCase();
          clearSearchBtn.classList.toggle('hidden', val.length === 0);
          if (!val) return;
          var match = state.patients.find(function (p) {
            return p.name.toLowerCase().indexOf(val) !== -1 || p.physician.toLowerCase().indexOf(val) !== -1;
          });
          if (match) {
            state.selectedPatientId = match.id;
            renderFeaturedPatient();
          }
        });

        clearSearchBtn.addEventListener('click', function () {
          searchInput.value = '';
          clearSearchBtn.classList.add('hidden');
          searchInput.focus();
        });

        // Support Slide-Over Drawer
        document.getElementById('supportBtn').addEventListener('click', function () {
          renderSupportFaqs('');
          document.getElementById('supportDrawerBackdrop').classList.remove('hidden');
        });
        document.getElementById('closeSupportDrawerBtn').addEventListener('click', function () {
          document.getElementById('supportDrawerBackdrop').classList.add('hidden');
        });
        document.getElementById('supportFaqSearch').addEventListener('input', function () {
          renderSupportFaqs(this.value);
        });

        // Content Layout Customizer
        var densityBtns = document.querySelectorAll('.density-btn');
        for (var d = 0; d < densityBtns.length; d++) {
          densityBtns[d].addEventListener('click', function () {
            state.density = this.getAttribute('data-density');
            saveState();
            applyWidgetVisibilityAndDensity();
            for (var k = 0; k < densityBtns.length; k++) {
              var active = densityBtns[k].getAttribute('data-density') === state.density;
              densityBtns[k].className = active
                ? 'density-btn py-1.5 text-xs font-semibold rounded-lg bg-white text-brand-700 shadow-xs'
                : 'density-btn py-1.5 text-xs font-medium rounded-lg text-slate-600';
            }
          });
        }

        var widgetToggles = document.querySelectorAll('.widget-toggle');
        for (var w = 0; w < widgetToggles.length; w++) {
          widgetToggles[w].addEventListener('change', function () {
            var wId = this.getAttribute('data-widget');
            var idx = state.hiddenWidgets.indexOf(wId);
            if (!this.checked && idx === -1) state.hiddenWidgets.push(wId);
            if (this.checked && idx !== -1) state.hiddenWidgets.splice(idx, 1);
            saveState();
            applyWidgetVisibilityAndDensity();
          });
        }

        document.getElementById('restoreWidgetsBtn').addEventListener('click', function () {
          state.hiddenWidgets = [];
          saveState();
          applyWidgetVisibilityAndDensity();
          showToast('All dashboard cards restored');
        });

        // Notifications interaction
        document.getElementById('markAllReadBtn').addEventListener('click', function () {
          for (var i = 0; i < state.notifications.length; i++) {
            state.notifications[i].unread = false;
          }
          saveState();
          renderNotifications();
          showToast('All alerts marked as read');
        });

        document.getElementById('notifList').addEventListener('click', function (e) {
          var item = e.target.closest('.notif-item-btn');
          if (!item) return;
          var id = item.getAttribute('data-notif-id');
          var found = state.notifications.find(function (n) { return n.id === id; });
          if (found) {
            found.unread = false;
            saveState();
            renderNotifications();
            document.getElementById('notifPopover').classList.add('hidden');
            if (found.targetTab) switchTab(found.targetTab);
          }
        });

        // Settings Modal (with Reset Data)
        document.getElementById('settingsBtn').addEventListener('click', function () {
          openModal('Demo Preferences',
            '<div class="space-y-4 text-xs">' +
              '<div class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">' +
                '<div>' +
                  '<p class="font-bold text-slate-800">Micro-Animations &amp; Transitions</p>' +
                  '<p class="text-[11px] text-slate-500">Enable smooth card hover lift and entrance choreography</p>' +
                '</div>' +
                '<input id="toggleAnimCheckbox" type="checkbox"' + (state.animationsEnabled ? ' checked' : '') + ' class="accent-teal-600 w-4 h-4" />' +
              '</div>' +
              '<div class="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-3">' +
                '<div>' +
                  '<p class="font-bold text-amber-900">Reset Clinical Demo Dataset</p>' +
                  '<p class="text-[11px] text-amber-700">Restore original patients, appointments, reports &amp; layout</p>' +
                '</div>' +
                '<button id="resetAllDataBtn" type="button" class="px-3.5 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-semibold shrink-0">Reset Data</button>' +
              '</div>' +
            '</div>'
          );

          document.getElementById('toggleAnimCheckbox').addEventListener('change', function () {
            state.animationsEnabled = this.checked;
            saveState();
            applyWidgetVisibilityAndDensity();
            showToast(this.checked ? 'Animations enabled' : 'Reduced motion enabled');
          });

          document.getElementById('resetAllDataBtn').addEventListener('click', function () {
            state = getDefaultState();
            saveState();
            renderAllDashboard();
            switchTab('dashboard');
            closeModal();
            showToast('Clinical workspace restored to default state');
          });
        });

        // Card 1: Pending Report series toggles
        document.getElementById('badgeReportSeries').addEventListener('click', function () {
          state.pendingHighlight = state.pendingHighlight === 'report' ? 'all' : 'report';
          renderPendingChart();
        });
        document.getElementById('badgeNoReportSeries').addEventListener('click', function () {
          state.pendingHighlight = state.pendingHighlight === 'noreport' ? 'all' : 'noreport';
          renderPendingChart();
        });

        // Card 2: News From The Doctor Carousel & "Today's info" modal
        var newsDots = document.querySelectorAll('.news-dot');
        for (var n = 0; n < newsDots.length; n++) {
          newsDots[n].addEventListener('click', function () {
            state.activeNewsSlide = Number(this.getAttribute('data-slide')) || 0;
            renderNewsCarousel();
          });
        }
        document.getElementById('todaysInfoBtn').addEventListener('click', function () {
          var slide = NEWS_SLIDES[state.activeNewsSlide] || NEWS_SLIDES[0];
          openModal("Today's Clinical Bulletin",
            '<div class="space-y-3 text-xs">' +
              '<span class="inline-block px-3 py-1 rounded-full bg-brand-50 text-brand-700 font-bold">VitalPulse Demo Clinic</span>' +
              '<h4 class="text-base font-bold text-slate-800">' + escapeHtml(slide.title) + '</h4>' +
              '<p class="text-slate-600 leading-relaxed">' + escapeHtml(slide.detail) + '</p>' +
              '<div class="pt-3 flex justify-end">' +
                '<button type="button" id="bookFromNewsBtn" class="px-4 py-2 rounded-full bg-[#0D9488] text-white font-semibold">Schedule Consultation</button>' +
              '</div>' +
            '</div>'
          );
          document.getElementById('bookFromNewsBtn').addEventListener('click', function () {
            openAppointmentFormModal(null);
          });
        });

        // Card 3: Cycle Health Trend Metric
        document.getElementById('cycleTrendMetricBtn').addEventListener('click', function () {
          state.trendMetricIndex = (state.trendMetricIndex + 1) % TREND_METRICS.length;
          saveState();
          renderTrendChart();
          showToast('Trend metric: ' + TREND_METRICS[state.trendMetricIndex].label);
        });

        // Card 4: Checkup Progress click-to-edit
        document.getElementById('checkupListContainer').addEventListener('click', function (e) {
          var btn = e.target.closest('.checkup-item-btn');
          if (!btn) return;
          var id = btn.getAttribute('data-checkup-id');
          var chk = state.checkups.find(function (c) { return c.id === id; });
          if (!chk) return;
          openModal('Update Checkup Milestone',
            '<form id="editCheckupForm" class="space-y-3.5 text-xs">' +
              '<div>' +
                '<label class="block font-semibold text-slate-700 mb-1">Scheduled Date</label>' +
                '<input type="text" name="date" required value="' + escapeHtml(chk.date) + '" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5" />' +
              '</div>' +
              '<div>' +
                '<label class="block font-semibold text-slate-700 mb-1">Completion Progress (' + chk.progress + '%)</label>' +
                '<input type="range" name="progress" min="5" max="100" value="' + chk.progress + '" class="w-full accent-teal-600" />' +
              '</div>' +
              '<div class="pt-2 flex justify-end">' +
                '<button type="submit" class="px-5 py-2 rounded-full bg-[#0D9488] text-white font-semibold">Save Milestone</button>' +
              '</div>' +
            '</form>'
          );
          document.getElementById('editCheckupForm').addEventListener('submit', function (ev) {
            ev.preventDefault();
            chk.date = this.date.value.trim() || chk.date;
            chk.progress = Number(this.progress.value) || chk.progress;
            saveState();
            renderCheckupProgress();
            closeModal();
            showToast('Checkup progress updated');
          });
        });

        document.getElementById('manageCheckupsBtn').addEventListener('click', function () {
          var first = state.checkups[0];
          if (first) {
            first.progress = first.progress >= 95 ? 42 : Math.min(100, first.progress + 12);
            saveState();
            renderCheckupProgress();
            showToast('Advanced checkup milestone to ' + first.progress + '%');
          }
        });

        // Card 5: Cycle Featured Patient & Digital Health QR Pass Modal
        document.getElementById('cycleFeaturedPatientBtn').addEventListener('click', function () {
          if (state.patients.length === 0) return;
          var idx = state.patients.findIndex(function (p) { return p.id === state.selectedPatientId; });
          var next = state.patients[(idx + 1) % state.patients.length];
          state.selectedPatientId = next.id;
          saveState();
          renderFeaturedPatient();
          populateFilterPatientDropdown();
          showToast('Viewing medical card: ' + next.name);
        });

        document.getElementById('openQrPassBtn').addEventListener('click', function () {
          var p = state.patients.find(function (item) { return item.id === state.selectedPatientId; }) || state.patients[0];
          if (!p) return;
          openModal('Digital Patient Health Pass',
            '<div class="flex flex-col items-center text-center space-y-3 text-xs">' +
              '<div class="p-4 rounded-3xl bg-brand-50 border border-brand-100">' +
                '<svg class="w-36 h-36 text-slate-900" viewBox="0 0 36 36" fill="currentColor">' +
                  '<path d="M2 2h10v10H2V2zm2 2v6h6V4H4zm2 2h2v2H6V6zm18-4h10v10H24V2zm2 2v6h6V4h-6zm2 2h2v2h-2V6zM2 24h10v10H2V24zm2 2v6h6v-6H4zm2 2h2v2H6v-2zm10-24h2v4h-2V4zm4 2h2v4h-2V6zm-4 6h4v2h-4v-2zm-2 4h4v4h-4v-4zm6 0h4v2h-4v-2zm6 0h6v4h-6v-4zm-12 6h2v4h-2v-4zm4 2h6v2h-6v-2zm8 0h4v6h-4v-6zm-14 4h4v6h-4v-6zm6 2h4v4h-4v-4zm6 2h2v2h-2v-2z" />' +
                '</svg>' +
              '</div>' +
              '<div>' +
                '<p class="text-base font-bold text-slate-800">' + escapeHtml(p.name) + '</p>' +
                '<p class="text-slate-500">ID: ' + escapeHtml(p.id.toUpperCase()) + ' &bull; ' + escapeHtml(p.physician) + '</p>' +
              '</div>' +
              '<p class="text-[11px] text-slate-500 max-w-xs">Sample pass for display only. It does not contain a scannable code.</p>' +
            '</div>'
          );
        });

        // Card 6: Recovery Bar Chart interactive selection & Legend toggles
        document.getElementById('recoveryBarsGrid').addEventListener('click', function (e) {
          var barBtn = e.target.closest('.recovery-bar-btn');
          if (!barBtn) return;
          state.selectedMonthIndex = Number(barBtn.getAttribute('data-bar-idx')) || 0;
          saveState();
          renderRecoveryBarChart();
        });

        document.getElementById('toggleProgressLegend').addEventListener('click', function () {
          state.showProgressSeries = !state.showProgressSeries;
          renderRecoveryBarChart();
        });
        document.getElementById('toggleRecoveryLegend').addEventListener('click', function () {
          state.showRecoverySeries = !state.showRecoverySeries;
          renderRecoveryBarChart();
        });

        // Card 7: My Doctor directory & direct booking
        function openDoctorDirectoryModal(focusDoctorId) {
          var html = '<div class="space-y-3 text-xs">';
          for (var i = 0; i < state.doctors.length; i++) {
            var d = state.doctors[i];
            var highlight = d.id === focusDoctorId ? ' border-brand-500 bg-brand-50/40' : ' border-slate-100';
            html +=
              '<div class="p-3.5 rounded-2xl border flex items-center justify-between gap-3' + highlight + '">' +
                '<div class="flex items-center gap-3 min-w-0">' +
                  '<img data-avatar src="' + escapeHtml(d.avatar) + '" alt="" class="w-11 h-11 rounded-full object-cover shrink-0" />' +
                  '<div class="min-w-0">' +
                    '<p class="font-bold text-slate-800 truncate">' + escapeHtml(d.name) + '</p>' +
                    '<p class="text-[11px] text-brand-700 font-semibold">' + escapeHtml(d.specialty) + '</p>' +
                    '<p class="text-[11px] text-slate-400">' + escapeHtml(d.hospital) + ' &bull; ' + escapeHtml(d.experience) + '</p>' +
                  '</div>' +
                '</div>' +
                '<button type="button" data-book-doc="' + escapeHtml(d.name) + '" class="book-doc-btn px-3.5 py-1.5 rounded-full bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold shrink-0">Book</button>' +
              '</div>';
          }
          html += '</div>';
          openModal('Demo Specialist Directory', html);

          var bookBtns = document.querySelectorAll('.book-doc-btn');
          for (var b = 0; b < bookBtns.length; b++) {
            bookBtns[b].addEventListener('click', function () {
              var docName = this.getAttribute('data-book-doc');
              openAppointmentFormModal(null, docName);
            });
          }
        }

        document.getElementById('openDoctorDirectoryBtn').addEventListener('click', function () {
          openDoctorDirectoryModal(null);
        });

        document.getElementById('myDoctorListContainer').addEventListener('click', function (e) {
          var row = e.target.closest('.doctor-row-btn');
          if (!row) return;
          openDoctorDirectoryModal(row.getAttribute('data-doc-id'));
        });

        // Close Universal Modal
        document.getElementById('closeUniversalModalBtn').addEventListener('click', closeModal);
        document.getElementById('universalModalBackdrop').addEventListener('click', function (e) {
          if (e.target === this) closeModal();
        });

        // Form Submissions inside Universal Modal (Delegated)
        document.addEventListener('submit', function (e) {
          // A field named "id" shadows HTMLFormElement.id; read the attribute instead.
          var formId = e.target.getAttribute('id');
          if (formId === 'patientCrudForm') {
            e.preventDefault();
            var f = e.target;
            var id = f.elements.namedItem('id').value;
            var record = {
              id: id || ('pat-' + Date.now()),
              name: f.name.value.trim(),
              role: 'Pasien',
              medicalHistory: f.medicalHistory.value.trim(),
              medications: f.medications.value.trim() || 'None',
              allergies: f.allergies.value.trim() || 'No allergies present',
              physician: f.physician.value,
              recoveryRate: Math.min(100, Math.max(1, Number(f.recoveryRate.value) || 85)),
              status: f.status.value,
              avatar: f.avatar.value.trim() || state.patients.find(function (p) { return p.id === id; })?.avatar || DEFAULT_AVATAR
            };

            if (id) {
              var idx = state.patients.findIndex(function (p) { return p.id === id; });
              if (idx !== -1) state.patients[idx] = record;
              showToast('Updated patient profile: ' + record.name);
            } else {
              state.patients.unshift(record);
              state.selectedPatientId = record.id;
              showToast('Registered patient: ' + record.name);
            }
            saveState();
            renderAllDashboard();
            renderPatientsTable();
            closeModal();
          }

          if (formId === 'appointmentCrudForm') {
            e.preventDefault();
            var af = e.target;
            var aid = af.elements.namedItem('id').value;
            var apt = {
              id: aid || ('apt-' + Date.now()),
              patientName: af.patientName.value,
              doctorName: af.doctorName.value,
              department: af.department.value.trim(),
              dateTime: af.dateTime.value.trim(),
              status: af.status.value
            };

            if (aid) {
              var aIdx = state.appointments.findIndex(function (x) { return x.id === aid; });
              if (aIdx !== -1) state.appointments[aIdx] = apt;
              showToast('Appointment updated');
            } else {
              state.appointments.unshift(apt);
              showToast('Consultation booked with ' + apt.doctorName);
            }
            saveState();
            renderAppointmentsTable();
            closeModal();
          }

          if (formId === 'reportCrudForm') {
            e.preventDefault();
            var rf = e.target;
            var rid = rf.elements.namedItem('id').value;
            var rpt = {
              id: rid || ('RPT-' + Math.floor(4100 + Math.random() * 899)),
              patientName: rf.patientName.value,
              panel: rf.panel.value.trim(),
              score: Math.min(100, Math.max(1, Number(rf.score.value) || 85)),
              date: rf.date.value.trim(),
              status: rf.status.value
            };

            if (rid) {
              var rIdx = state.reports.findIndex(function (x) { return x.id === rid; });
              if (rIdx !== -1) state.reports[rIdx] = rpt;
              showToast('Diagnostic report updated');
            } else {
              state.reports.unshift(rpt);
              showToast('Published diagnostic report ' + rpt.id);
            }
            saveState();
            renderAllDashboard();
            renderReportsTable();
            closeModal();
          }
        });

        // Patient View CRUD buttons & filters
        document.getElementById('addPatientModalBtn').addEventListener('click', function () {
          openPatientFormModal(null);
        });
        document.getElementById('patientSearchInput').addEventListener('input', function () {
          patientPage = 1;
          renderPatientsTable();
        });
        document.getElementById('patientStatusFilter').addEventListener('change', function () {
          patientPage = 1;
          renderPatientsTable();
        });
        document.getElementById('patientSortSelect').addEventListener('change', renderPatientsTable);

        document.getElementById('selectAllPatientsCb').addEventListener('change', function () {
          var cbs = document.querySelectorAll('.pat-row-cb');
          selectedPatientIds = [];
          for (var i = 0; i < cbs.length; i++) {
            cbs[i].checked = this.checked;
            if (this.checked) selectedPatientIds.push(cbs[i].getAttribute('data-pat-cb'));
          }
          updateBulkDeleteUi();
        });

        document.getElementById('bulkDeletePatientsBtn').addEventListener('click', function () {
          if (selectedPatientIds.length === 0) return;
          state.patients = state.patients.filter(function (p) {
            return selectedPatientIds.indexOf(p.id) === -1;
          });
          selectedPatientIds = [];
          document.getElementById('selectAllPatientsCb').checked = false;
          saveState();
          renderAllDashboard();
          renderPatientsTable();
          showToast('Selected patient records removed', 'warn');
        });

        document.getElementById('patientsTableBody').addEventListener('click', function (e) {
          var cb = e.target.closest('.pat-row-cb');
          if (cb) {
            var cid = cb.getAttribute('data-pat-cb');
            var pos = selectedPatientIds.indexOf(cid);
            if (cb.checked && pos === -1) selectedPatientIds.push(cid);
            if (!cb.checked && pos !== -1) selectedPatientIds.splice(pos, 1);
            updateBulkDeleteUi();
            return;
          }

          var focusBtn = e.target.closest('[data-focus-pat]');
          if (focusBtn) {
            state.selectedPatientId = focusBtn.getAttribute('data-focus-pat');
            saveState();
            renderAllDashboard();
            switchTab('dashboard');
            showToast('Pinned patient to dashboard Medical Information');
            return;
          }

          var editBtn = e.target.closest('[data-edit-pat]');
          if (editBtn) {
            var eid = editBtn.getAttribute('data-edit-pat');
            var pat = state.patients.find(function (p) { return p.id === eid; });
            if (pat) openPatientFormModal(pat);
            return;
          }

          var delBtn = e.target.closest('[data-del-pat]');
          if (delBtn) {
            var did = delBtn.getAttribute('data-del-pat');
            state.patients = state.patients.filter(function (p) { return p.id !== did; });
            saveState();
            renderAllDashboard();
            renderPatientsTable();
            showToast('Patient record deleted', 'warn');
          }
        });

        document.getElementById('patientsPaginationBar').addEventListener('click', function (e) {
          if (e.target.id === 'prevPatPageBtn' && patientPage > 1) {
            patientPage--;
            renderPatientsTable();
          }
          if (e.target.id === 'nextPatPageBtn') {
            patientPage++;
            renderPatientsTable();
          }
        });

        // Appointment View CRUD buttons
        document.getElementById('addAppointmentModalBtn').addEventListener('click', function () {
          openAppointmentFormModal(null);
        });
        document.getElementById('appointmentSearchInput').addEventListener('input', renderAppointmentsTable);
        document.getElementById('appointmentStatusFilter').addEventListener('change', renderAppointmentsTable);
        document.getElementById('appointmentsTableBody').addEventListener('click', function (e) {
          var editBtn = e.target.closest('[data-edit-apt]');
          if (editBtn) {
            var aid = editBtn.getAttribute('data-edit-apt');
            var apt = state.appointments.find(function (x) { return x.id === aid; });
            if (apt) openAppointmentFormModal(apt);
            return;
          }
          var delBtn = e.target.closest('[data-del-apt]');
          if (delBtn) {
            var did = delBtn.getAttribute('data-del-apt');
            state.appointments = state.appointments.filter(function (x) { return x.id !== did; });
            saveState();
            renderAppointmentsTable();
            showToast('Appointment cancelled', 'warn');
          }
        });

        // Report View CRUD buttons
        document.getElementById('addReportModalBtn').addEventListener('click', function () {
          openReportFormModal(null);
        });
        document.getElementById('reportSearchInput').addEventListener('input', renderReportsTable);
        document.getElementById('reportStatusFilter').addEventListener('change', renderReportsTable);
        document.getElementById('reportsTableBody').addEventListener('click', function (e) {
          var editBtn = e.target.closest('[data-edit-rpt]');
          if (editBtn) {
            var rid = editBtn.getAttribute('data-edit-rpt');
            var rpt = state.reports.find(function (x) { return x.id === rid; });
            if (rpt) openReportFormModal(rpt);
            return;
          }
          var delBtn = e.target.closest('[data-del-rpt]');
          if (delBtn) {
            var did = delBtn.getAttribute('data-del-rpt');
            state.reports = state.reports.filter(function (x) { return x.id !== did; });
            saveState();
            renderAllDashboard();
            renderReportsTable();
            showToast('Report removed', 'warn');
          }
        });

        // Auto-advance News From The Doctor carousel every 6 seconds
        setInterval(function () {
          if (!state.animationsEnabled || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
          if (state.activeTab !== 'dashboard') return;
          if (!document.getElementById('universalModalBackdrop').classList.contains('hidden')) return;
          state.activeNewsSlide = (state.activeNewsSlide + 1) % NEWS_SLIDES.length;
          renderNewsCarousel();
        }, 6000);
      }

      // Initialize application on DOMContentLoaded
      window.addEventListener('DOMContentLoaded', function () {
        document.addEventListener('error', function (event) {
          var img = event.target;
          if (img instanceof HTMLImageElement && img.hasAttribute('data-avatar') && img.getAttribute('src') !== DEFAULT_AVATAR) {
            img.src = DEFAULT_AVATAR;
          }
        }, true);
        document.getElementById('timeframeLabel').textContent = state.timeframe || 'Monthly';
        renderAllDashboard();
        bindEvents();
        switchTab(state.activeTab || 'dashboard');
      });
    })();
