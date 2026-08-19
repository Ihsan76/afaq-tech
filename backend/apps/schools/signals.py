from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from apps.users.services import RoleService


@receiver(post_save, sender='schools.SchoolTeacher')
def assign_teacher_role_on_create(sender, instance, created, **kwargs):
    if created:
        RoleService.assign_role(instance.teacher, 'teacher')


@receiver(post_delete, sender='schools.SchoolTeacher')
def revoke_teacher_role_on_last_school(sender, instance, **kwargs):
    has_other = sender.objects.filter(teacher=instance.teacher).exclude(pk=instance.pk).exists()
    if not has_other:
        RoleService.revoke_role(instance.teacher, 'teacher')


@receiver(post_save, sender='schools.SchoolStaff')
def assign_staff_role_on_create(sender, instance, created, **kwargs):
    if created:
        RoleService.assign_role(instance.user, instance.role)


@receiver(post_delete, sender='schools.SchoolStaff')
def revoke_staff_role_on_delete(sender, instance, **kwargs):
    has_other = sender.objects.filter(user=instance.user).exclude(pk=instance.pk).exists()
    if not has_other:
        RoleService.revoke_role(instance.user, instance.role)
