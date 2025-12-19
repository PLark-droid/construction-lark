/**
 * レポート出力サービス
 * 工程表のCSV/JSON出力機能
 */

import type {
  ScheduleItem,
  GanttChartData,
  PersonGanttData,
  EquipmentGanttData,
} from '../types/schedule';
import type { ScheduleAlert } from './schedule-service';
import type { ConstructionContract } from '../types/construction';

export interface ReportConfig {
  title?: string;
  generatedAt?: string;
  author?: string;
}

export interface GanttReportData {
  contract: ConstructionContract;
  schedules: ScheduleItem[];
  summary: {
    totalDuration: number;
    overallProgress: number;
    delayedItems: number;
    completedItems: number;
    upcomingItems: number;
  };
  alerts: ScheduleAlert[];
}

export interface PersonReportData {
  personId: string;
  personName: string;
  department: string;
  assignments: Array<{
    contractName: string;
    scheduleName: string;
    startDate: string;
    endDate: string;
    progress: number;
    status: string;
  }>;
  workloadSummary: {
    currentAssignments: number;
    upcomingAssignments: number;
    utilizationRate: number;
  };
}

export interface EquipmentReportData {
  equipmentId: string;
  equipmentName: string;
  category: string;
  totalQuantity: number;
  allocations: Array<{
    contractName: string;
    scheduleName: string;
    startDate: string;
    endDate: string;
    quantity: number;
  }>;
  availabilitySummary: {
    currentlyUsed: number;
    available: number;
    utilizationRate: number;
  };
}

export class ReportService {
  // ========================================
  // ガントチャートレポート
  // ========================================

  generateGanttCSV(data: GanttChartData, config?: ReportConfig): string {
    const lines: string[] = [];

    // ヘッダー情報
    lines.push(`# 工程表レポート`);
    lines.push(`# 工事名: ${data.contract.projectName}`);
    lines.push(`# 発注者: ${data.contract.clientName}`);
    lines.push(`# 工期: ${data.contract.startDate} 〜 ${data.contract.completionDate}`);
    lines.push(`# 出力日時: ${config?.generatedAt || new Date().toISOString()}`);
    lines.push('');

    // サマリー
    lines.push('## サマリー');
    lines.push(`全体進捗率,${data.summary.overallProgress}%`);
    lines.push(`総工期,${data.summary.totalDuration}日`);
    lines.push(`経過日数,${data.summary.elapsedDays}日`);
    lines.push(`残日数,${data.summary.remainingDays}日`);
    lines.push(`遅延工程数,${data.summary.delayedItems}件`);
    lines.push('');

    // 工程一覧
    lines.push('## 工程一覧');
    lines.push('工程名,開始日,終了日,進捗率,ステータス,クリティカルパス');

    for (const item of data.scheduleItems) {
      lines.push([
        item.name,
        item.startDate,
        item.endDate,
        `${item.progress}%`,
        this.statusToJapanese(item.status),
        item.isCriticalPath ? 'はい' : 'いいえ',
      ].join(','));
    }

    lines.push('');

    // マイルストーン
    if (data.milestones.length > 0) {
      lines.push('## マイルストーン');
      lines.push('マイルストーン名,予定日,ステータス');

      for (const milestone of data.milestones) {
        lines.push([
          milestone.name,
          milestone.date,
          this.milestoneStatusToJapanese(milestone.status),
        ].join(','));
      }
    }

    return lines.join('\n');
  }

  generateGanttJSON(data: GanttChartData, config?: ReportConfig): string {
    const report = {
      meta: {
        type: 'gantt_chart_report',
        generatedAt: config?.generatedAt || new Date().toISOString(),
        author: config?.author,
      },
      contract: {
        id: data.contract.id,
        projectName: data.contract.projectName,
        clientName: data.contract.clientName,
        startDate: data.contract.startDate,
        completionDate: data.contract.completionDate,
        status: data.contract.status,
      },
      summary: data.summary,
      schedules: data.scheduleItems.map(item => ({
        id: item.id,
        name: item.name,
        startDate: item.startDate,
        endDate: item.endDate,
        progress: item.progress,
        status: item.status,
        isCriticalPath: item.isCriticalPath,
        dependencies: item.dependencies,
      })),
      milestones: data.milestones,
    };

    return JSON.stringify(report, null, 2);
  }

  // ========================================
  // 人別稼働レポート
  // ========================================

  generatePersonReportCSV(data: PersonGanttData[], config?: ReportConfig): string {
    const lines: string[] = [];

    lines.push(`# 人別稼働レポート`);
    lines.push(`# 出力日時: ${config?.generatedAt || new Date().toISOString()}`);
    lines.push('');

    lines.push('担当者名,所属,現在の担当数,予定の担当数,稼働率');

    for (const person of data) {
      lines.push([
        person.person.name,
        person.person.department,
        person.workload.currentAssignments.toString(),
        person.workload.upcomingAssignments.toString(),
        `${person.workload.utilizationRate}%`,
      ].join(','));
    }

    lines.push('');
    lines.push('## 詳細割当');
    lines.push('担当者名,工事名,工程名,開始日,終了日');

    for (const person of data) {
      for (const assignment of person.assignments) {
        lines.push([
          person.person.name,
          assignment.contractName,
          assignment.scheduleItem.name,
          assignment.period.start,
          assignment.period.end,
        ].join(','));
      }
    }

    return lines.join('\n');
  }

  generatePersonReportJSON(data: PersonGanttData[], config?: ReportConfig): string {
    const report = {
      meta: {
        type: 'person_workload_report',
        generatedAt: config?.generatedAt || new Date().toISOString(),
        author: config?.author,
      },
      persons: data.map(p => ({
        id: p.person.id,
        name: p.person.name,
        department: p.person.department,
        workload: p.workload,
        assignments: p.assignments.map(a => ({
          contractName: a.contractName,
          scheduleName: a.scheduleItem.name,
          startDate: a.period.start,
          endDate: a.period.end,
          progress: a.scheduleItem.progress,
          status: a.scheduleItem.status,
        })),
      })),
    };

    return JSON.stringify(report, null, 2);
  }

  // ========================================
  // 機材別稼働レポート
  // ========================================

  generateEquipmentReportCSV(data: EquipmentGanttData[], config?: ReportConfig): string {
    const lines: string[] = [];

    lines.push(`# 機材別稼働レポート`);
    lines.push(`# 出力日時: ${config?.generatedAt || new Date().toISOString()}`);
    lines.push('');

    lines.push('機材名,分類,保有数,使用中,空き,稼働率');

    for (const equipment of data) {
      lines.push([
        equipment.equipment.name,
        equipment.equipment.category,
        equipment.availability.totalQuantity.toString(),
        equipment.availability.currentlyUsed.toString(),
        equipment.availability.available.toString(),
        `${equipment.availability.utilizationRate}%`,
      ].join(','));
    }

    lines.push('');
    lines.push('## 詳細割当');
    lines.push('機材名,工事名,工程名,開始日,終了日,数量');

    for (const equipment of data) {
      for (const allocation of equipment.allocations) {
        lines.push([
          equipment.equipment.name,
          allocation.contractName,
          allocation.scheduleItem.name,
          allocation.period.start,
          allocation.period.end,
          allocation.quantity.toString(),
        ].join(','));
      }
    }

    return lines.join('\n');
  }

  generateEquipmentReportJSON(data: EquipmentGanttData[], config?: ReportConfig): string {
    const report = {
      meta: {
        type: 'equipment_utilization_report',
        generatedAt: config?.generatedAt || new Date().toISOString(),
        author: config?.author,
      },
      equipment: data.map(e => ({
        id: e.equipment.id,
        name: e.equipment.name,
        category: e.equipment.category,
        availability: e.availability,
        allocations: e.allocations.map(a => ({
          contractName: a.contractName,
          scheduleName: a.scheduleItem.name,
          startDate: a.period.start,
          endDate: a.period.end,
          quantity: a.quantity,
        })),
      })),
    };

    return JSON.stringify(report, null, 2);
  }

  // ========================================
  // アラートレポート
  // ========================================

  generateAlertReportCSV(alerts: ScheduleAlert[], config?: ReportConfig): string {
    const lines: string[] = [];

    lines.push(`# アラートレポート`);
    lines.push(`# 出力日時: ${config?.generatedAt || new Date().toISOString()}`);
    lines.push(`# アラート件数: ${alerts.length}件`);
    lines.push('');

    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;
    const infoCount = alerts.filter(a => a.severity === 'info').length;

    lines.push('## サマリー');
    lines.push(`重大,${criticalCount}件`);
    lines.push(`警告,${warningCount}件`);
    lines.push(`情報,${infoCount}件`);
    lines.push('');

    lines.push('## アラート一覧');
    lines.push('重要度,タイプ,工程名,期限,残日数,メッセージ');

    for (const alert of alerts) {
      lines.push([
        this.severityToJapanese(alert.severity),
        this.alertTypeToJapanese(alert.type),
        alert.scheduleName,
        alert.dueDate,
        alert.daysRemaining.toString(),
        `"${alert.message}"`,
      ].join(','));
    }

    return lines.join('\n');
  }

  generateAlertReportJSON(alerts: ScheduleAlert[], config?: ReportConfig): string {
    const report = {
      meta: {
        type: 'alert_report',
        generatedAt: config?.generatedAt || new Date().toISOString(),
        author: config?.author,
      },
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length,
      },
      alerts: alerts.map(a => ({
        type: a.type,
        severity: a.severity,
        scheduleId: a.scheduleId,
        scheduleName: a.scheduleName,
        contractId: a.contractId,
        message: a.message,
        dueDate: a.dueDate,
        daysRemaining: a.daysRemaining,
      })),
    };

    return JSON.stringify(report, null, 2);
  }

  // ========================================
  // ヘルパー関数
  // ========================================

  private statusToJapanese(status: string): string {
    const map: Record<string, string> = {
      'not_started': '未着手',
      'in_progress': '進行中',
      'delayed': '遅延',
      'completed': '完了',
      'on_hold': '保留',
    };
    return map[status] || status;
  }

  private milestoneStatusToJapanese(status: string): string {
    const map: Record<string, string> = {
      'pending': '未達成',
      'achieved': '達成',
      'missed': '未達',
    };
    return map[status] || status;
  }

  private severityToJapanese(severity: string): string {
    const map: Record<string, string> = {
      'critical': '重大',
      'warning': '警告',
      'info': '情報',
    };
    return map[severity] || severity;
  }

  private alertTypeToJapanese(type: string): string {
    const map: Record<string, string> = {
      'delayed': '遅延',
      'upcoming_deadline': '期限間近',
      'overdue': '期限超過',
      'milestone_approaching': 'マイルストーン',
    };
    return map[type] || type;
  }
}
